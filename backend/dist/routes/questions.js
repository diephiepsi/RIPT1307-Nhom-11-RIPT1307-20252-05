"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.questionsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
const auth_1 = require("../middlewares/auth");
const voting_1 = require("../utils/voting");
const mail_1 = require("../services/mail");
const router = (0, express_1.Router)();
// Lấy danh sách bài viết (Public Feed - Chỉ lấy bài ĐÃ DUYỆT)
router.get("/", auth_1.authOptional, async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q : undefined;
  const tag = typeof req.query.tag === "string" ? req.query.tag : undefined;
  const questions = await db_1.prisma.question.findMany({
    where: {
      deletedAt: null,
      isApproved: true, // THÊM DÒNG NÀY: Chỉ lấy những bài đã được Admin duyệt
      ...(q
        ? {
            OR: [{ title: { contains: q } }, { content: { contains: q } }],
          }
        : {}),
      ...(tag
        ? {
            tags: { some: { tag: { name: tag } } },
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, fullName: true, role: true } },
      tags: { include: { tag: true } },
      votes: { select: { value: true, userId: true } },
      _count: { select: { comments: true } },
    },
  });
  res.json(
    questions.map((x) => ({
      id: x.id,
      title: x.title,
      createdAt: x.createdAt.toISOString(),
      author: x.author,
      tags: x.tags.map((t) => t.tag),
      votes: (0, voting_1.summarizeVotes)(x.votes, req.user?.id),
      answersCount: x._count.comments,
    })),
  );
});
// Xem chi tiết bài viết
router.get("/:id", auth_1.authOptional, async (req, res) => {
  const id = String(req.params.id);
  const q = await db_1.prisma.question.findFirst({
    where: { id, deletedAt: null },
    include: {
      author: { select: { id: true, fullName: true, role: true } },
      tags: { include: { tag: true } },
      votes: { select: { value: true, userId: true } },
      comments: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          content: true,
          parentId: true,
          createdAt: true,
          author: { select: { id: true, fullName: true, role: true } },
          votes: { select: { value: true, userId: true } },
        },
      },
    },
  });
  if (!q) return res.status(404).json({ message: "Không tìm thấy bài viết" });
  // THÊM LOGIC KIỂM TRA DUYỆT BÀI:
  // Nếu bài chưa duyệt, chỉ Admin hoặc Tác giả của bài viết mới được xem chi tiết
  if (!q.isApproved) {
    if (
      !req.user ||
      (req.user.role !== "ADMIN" && req.user.id !== q.authorId)
    ) {
      return res
        .status(403)
        .json({ message: "Bài viết này đang chờ Quản trị viên duyệt." });
    }
  }
  res.json({
    id: q.id,
    title: q.title,
    content: q.content,
    createdAt: q.createdAt.toISOString(),
    author: q.author,
    tags: q.tags.map((t) => t.tag),
    votes: (0, voting_1.summarizeVotes)(q.votes, req.user?.id),
    comments: q.comments.map((c) => ({
      id: c.id,
      content: c.content,
      parentId: c.parentId,
      createdAt: c.createdAt.toISOString(),
      author: c.author,
      votes: (0, voting_1.summarizeVotes)(c.votes, req.user?.id),
    })),
  });
});
const createSchema = zod_1.z.object({
  title: zod_1.z.string().min(10),
  content: zod_1.z.string().min(20),
  tags: zod_1.z.array(zod_1.z.string().min(1)).min(1),
});
// Đăng bài mới
router.post("/", auth_1.authRequired, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const { title, content, tags } = parsed.data;
  const created = await db_1.prisma.$transaction(async (tx) => {
    const q = await tx.question.create({
      data: {
        title,
        content,
        authorId: req.user.id,
        // isApproved tự động bằng false theo Schema Prisma
      },
    });
    for (const tagName of tags) {
      const t = await tx.tag.upsert({
        where: { name: tagName },
        update: {},
        create: { name: tagName },
      });
      await tx.questionTag.create({ data: { questionId: q.id, tagId: t.id } });
    }
    return q;
  });
  // Gửi thông báo đến Admin: Sửa lại nội dung mail báo là cần duyệt
  const recipients = await db_1.prisma.user.findMany({
    where: { role: "ADMIN", locked: false }, // Đổi thành chỉ gửi cho Admin vì cần duyệt bài
    select: { email: true },
  });
  await Promise.allSettled(
    recipients.map((u) =>
      (0, mail_1.sendMail)({
        to: u.email,
        subject: "Yêu cầu duyệt bài đăng mới trên diễn đàn",
        html: `<p><b>${title}</b></p><p>Vừa có một bài đăng mới đang chờ bạn duyệt. Vào hệ thống Admin để kiểm tra và duyệt bài.</p>`,
      }),
    ),
  );
  const detail = await db_1.prisma.question.findFirst({
    where: { id: created.id },
    include: {
      author: { select: { id: true, fullName: true, role: true } },
      tags: { include: { tag: true } },
      votes: true,
      comments: true,
    },
  });
  if (!detail) return res.status(500).json({ message: "Create failed" });
  res.status(201).json({
    id: detail.id,
    title: detail.title,
    content: detail.content,
    createdAt: detail.createdAt.toISOString(),
    author: detail.author,
    tags: detail.tags.map((t) => t.tag),
    votes: (0, voting_1.summarizeVotes)([], req.user?.id),
    comments: [],
  });
});
const addCommentSchema = zod_1.z.object({
  content: zod_1.z.string().min(1),
  parentId: zod_1.z.string().optional(),
});
// Bình luận
router.post("/:id/comments", auth_1.authRequired, async (req, res) => {
  const parsed = addCommentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const questionId = String(req.params.id);
  const q = await db_1.prisma.question.findFirst({
    where: { id: questionId, deletedAt: null },
    include: { author: { select: { email: true, fullName: true } } },
  });
  if (!q) return res.status(404).json({ message: "Not found" });
  if (parsed.data.parentId) {
    const parent = await db_1.prisma.comment.findFirst({
      where: { id: parsed.data.parentId, questionId, deletedAt: null },
    });
    if (!parent)
      return res.status(400).json({ message: "Parent comment not found" });
  }
  const c = await db_1.prisma.comment.create({
    data: {
      questionId,
      authorId: req.user.id,
      content: parsed.data.content,
      parentId: parsed.data.parentId ?? null,
    },
  });
  await (0, mail_1.sendMail)({
    to: q.author.email,
    subject: "Có người trả lời bình luận/câu hỏi của bạn",
    html: `<p>Chào ${q.author.fullName},</p><p>Có bình luận mới cho câu hỏi: <b>${q.title}</b></p>`,
  });
  res.status(201).json({ id: c.id });
});
// Vote
router.post("/:id/vote", auth_1.authRequired, async (req, res) => {
  const schema = zod_1.z.object({
    value: zod_1.z.union([
      zod_1.z.literal(-1),
      zod_1.z.literal(0),
      zod_1.z.literal(1),
    ]),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const questionId = String(req.params.id);
  const q = await db_1.prisma.question.findFirst({
    where: { id: questionId, deletedAt: null },
    select: { id: true },
  });
  if (!q) return res.status(404).json({ message: "Not found" });
  const value = parsed.data.value;
  if (value === 0) {
    await db_1.prisma.vote.deleteMany({
      where: { userId: req.user.id, questionId },
    });
  } else {
    await db_1.prisma.vote.upsert({
      where: { userId_questionId: { userId: req.user.id, questionId } },
      update: { value },
      create: { userId: req.user.id, questionId, value },
    });
  }
  res.json({ ok: true });
});
exports.questionsRouter = router;
