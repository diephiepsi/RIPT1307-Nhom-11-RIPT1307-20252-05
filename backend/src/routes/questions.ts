import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { authOptional, authRequired } from "../middlewares/auth";
import { summarizeVotes } from "../utils/voting";
import { sendMail } from "../services/mail";

const router = Router();

<<<<<<< HEAD
// ============================================================
// 1. LẤY DANH SÁCH BÀI VIẾT (Public Feed - Chỉ lấy bài ĐÃ DUYỆT)
// ============================================================
router.get('/', authOptional, async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q : undefined;
  const tag = typeof req.query.tag === 'string' ? req.query.tag : undefined;
=======
// Lấy danh sách bài viết (Public Feed - Chỉ lấy bài ĐÃ DUYỆT)
router.get("/", authOptional, async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q : undefined;
  const tag = typeof req.query.tag === "string" ? req.query.tag : undefined;
  const sort = typeof req.query.sort === "string" ? req.query.sort : "recent";

  // Thiết lập điều kiện sắp xếp dựa trên tham số `sort`
  let orderBy:
    | Prisma.QuestionOrderByWithRelationInput
    | Prisma.QuestionOrderByWithRelationInput[] = { createdAt: "desc" };
  switch (sort) {
    case "most-votes": // Sắp xếp theo điểm vote cao nhất
      orderBy = { score: "desc" };
      break;
    case "most-views": // Sắp xếp theo lượt xem nhiều nhất
      orderBy = { viewCount: "desc" };
      break;
    case "most-comments": // Sắp xếp theo bình luận nhiều nhất
      orderBy = { comments: { _count: "desc" } };
      break;
    case "recent": // Sắp xếp theo thời gian gần nhất (mặc định)
    default:
      orderBy = { createdAt: "desc" };
      break;
  }
>>>>>>> a75d423df4bad6686fee87e91111b3aa4814a2ce

  const questions = await prisma.question.findMany({
    where: {
      deletedAt: null,
      isApproved: true, // Chỉ lấy những bài đã được Admin duyệt
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
    orderBy,
    include: {
      author: { select: { id: true, fullName: true, role: true } },
      tags: { include: { tag: true } },
      votes: { select: { value: true, userId: true } },
      _count: { select: { comments: { where: { deletedAt: null } } } },
    },
  });

  res.json(
    questions.map((x: (typeof questions)[number]) => ({
      id: x.id,
      title: x.title,
      createdAt: x.createdAt.toISOString(),
      author: x.author,
      tags: x.tags.map((t: (typeof x.tags)[number]) => t.tag),
      votes: summarizeVotes(x.votes, req.user?.id),
      answersCount: x._count.comments,
      viewCount: x.viewCount,
    })),
  );
});

<<<<<<< HEAD
// ============================================================
// 2. XEM CHI TIẾT BÀI VIẾT
// ============================================================
router.get('/:id', authOptional, async (req, res) => {
=======
// API Bảng Xếp Hạng (Leaderboard) - Trả về Top 10
router.get("/stats/dashboard", authOptional, async (req, res) => {
  try {
    // Top 10 lượt xem
    const topViews = await prisma.question.findMany({
      where: { deletedAt: null, isApproved: true },
      orderBy: { viewCount: "desc" },
      take: 10,
      select: { id: true, title: true, viewCount: true },
    });

    // Top 10 bình luận nhiều nhất
    const topComments = await prisma.question.findMany({
      where: { deletedAt: null, isApproved: true },
      orderBy: { comments: { _count: "desc" } },
      take: 10,
      select: { id: true, title: true, _count: { select: { comments: true } } },
    });

    // Top 10 lượt thích (Dùng raw query để SUM value của votes)
    const topLikesRaw = await prisma.$queryRaw`
      SELECT p.id, p.title, CAST(COALESCE(SUM(v.value), 0) AS SIGNED) AS score
      FROM posts p
      LEFT JOIN votes v ON p.id = v.post_id
      WHERE p.deleted_at IS NULL AND p.is_approved = 1
      GROUP BY p.id
      ORDER BY score DESC
      LIMIT 10
    `;

    res.json({
      topViews,
      topComments: topComments.map((c: any) => ({
        id: c.id,
        title: c.title,
        commentsCount: c._count.comments,
      })),
      topLikes: topLikesRaw,
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy dữ liệu thống kê" });
  }
});

// Xem chi tiết bài viết
=======
  let rows = questions.map((x) => mapQuestionListItem(x, req.user?.id));

  if (status === "unanswered") rows = rows.filter((x) => x.answersCount === 0);
  if (status === "answered") rows = rows.filter((x) => x.answersCount > 0);
  if (sort === "likes") rows.sort((a, b) => b.likesCount - a.likesCount);
  if (sort === "answers") rows.sort((a, b) => b.answersCount - a.answersCount);
  if (sort === "hot") rows.sort((a, b) => b.hotScore - a.hotScore);

  res.json(rows);
});

>>>>>>> c959ec9786529665ed0bb40da14a6ee6f9ea50dd
router.get("/:id", authOptional, async (req, res) => {
>>>>>>> a75d423df4bad6686fee87e91111b3aa4814a2ce
  const id = String(req.params.id);

  const q = await prisma.question.findFirst({
    where: { id, deletedAt: null },
    include: {
      author: { select: { id: true, fullName: true, role: true } },
      tags: { include: { tag: true } },
      votes: { select: { value: true, userId: true } },
      bookmarks: req.user?.id
        ? { where: { userId: req.user.id }, select: { id: true } }
        : false,
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

<<<<<<< HEAD
  // Kiểm tra quyền xem nếu bài đăng chưa được phê duyệt
=======
  if (!q) return res.status(404).json({ message: "Không tìm thấy bài viết" });

  // THÊM LOGIC KIỂM TRA DUYỆT BÀI:
  // Nếu bài chưa duyệt, chỉ Admin hoặc Tác giả của bài viết mới được xem chi tiết
>>>>>>> a75d423df4bad6686fee87e91111b3aa4814a2ce
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

  // Tự động tăng 1 lượt xem trong Database
  await prisma.question.updateMany({
    where: { id, deletedAt: null },
    data: { viewCount: { increment: 1 } },
  });

  res.json({
    id: q.id,
    title: q.title,
    content: q.content,
    createdAt: q.createdAt.toISOString(),
    updatedAt: q.updatedAt.toISOString(),
    author: q.author,
    viewCount: q.viewCount + 1,
    tags: q.tags.map((t: (typeof q.tags)[number]) => t.tag),
    votes: summarizeVotes(q.votes, req.user?.id),
    comments: q.comments.map((c: (typeof q.comments)[number]) => ({
      id: c.id,
      content: c.content,
      parentId: c.parentId,
      createdAt: c.createdAt.toISOString(),
      author: c.author,
      votes: summarizeVotes(c.votes, req.user?.id),
    })),
  });
});

const createSchema = z.object({
  title: z.string().min(10),
  content: z.string().min(20),
  tags: z.array(z.string().min(1)).min(1),
});

<<<<<<< HEAD
// ============================================================
// 3. ĐĂNG BÀI VIẾT MỚI
// ============================================================
router.post('/', authRequired, async (req, res) => {
=======
// Đăng bài mới
router.post("/", authRequired, async (req, res) => {
>>>>>>> a75d423df4bad6686fee87e91111b3aa4814a2ce
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const { title, content, tags } = parsed.data;

<<<<<<< HEAD
  const created = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const q = await tx.question.create({
      data: {
        title,
        content,
        authorId: req.user!.id,
        // isApproved tự động bằng false theo Schema định nghĩa trong prisma
      },
    });

    for (const tagName of tags) {
      const t = await tx.tag.upsert({
        where: { name: tagName },
        update: {},
        create: { name: tagName },
=======
  const created = await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      const q = await tx.question.create({
        data: {
          title,
          content,
          authorId: req.user!.id,
          // isApproved tự động bằng false theo Schema Prisma
        },
>>>>>>> a75d423df4bad6686fee87e91111b3aa4814a2ce
      });

      for (const rawTagName of tags) {
        const tagName = rawTagName.trim();
        if (!tagName) continue;
        const t = await tx.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName },
        });
        await tx.questionTag.create({
          data: { questionId: q.id, tagId: t.id },
        });
      }

      return q;
    },
  );

<<<<<<< HEAD
  // Tìm và gửi thông báo kiểm duyệt bài đăng qua Mail đến các Admin hệ thống
  const recipients = await prisma.user.findMany({
    where: { role: 'ADMIN', locked: false }, 
    select: { email: true },
  });
  
=======
  const recipients = await prisma.user.findMany({
    where: { role: "ADMIN", locked: false }, // Đổi thành chỉ gửi cho Admin vì cần duyệt bài
    select: { email: true },
  });

>>>>>>> a75d423df4bad6686fee87e91111b3aa4814a2ce
  await Promise.allSettled(
    recipients.map((u) =>
      sendMail({
        to: u.email,
        subject: "Yêu cầu duyệt bài đăng mới trên diễn đàn",
        html: `<p><b>${title}</b></p><p>Vừa có một bài đăng mới đang chờ bạn duyệt. Vào hệ thống Admin để kiểm tra và duyệt bài.</p>`,
      }),
    ),
  );

  const detail = await prisma.question.findFirst({
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
    tags: detail.tags.map((t: (typeof detail.tags)[number]) => t.tag),
    votes: summarizeVotes([], req.user?.id),
    comments: [],
  });
});

const addCommentSchema = z.object({
  content: z.string().min(1),
  parentId: z.string().optional(),
});

<<<<<<< HEAD
// ============================================================
// 4. BÌNH LUẬN (Tối ưu hóa phản hồi lập tức và bọc lót chống sập)
// ============================================================
router.post('/:id/comments', authRequired, async (req, res) => {
=======
// Bình luận
router.post("/:id/comments", authRequired, async (req, res) => {
>>>>>>> a75d423df4bad6686fee87e91111b3aa4814a2ce
  const parsed = addCommentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

<<<<<<< HEAD
  try {
    const q = await prisma.question.findFirst({
      where: { id: questionId, deletedAt: null },
      include: { author: { select: { id: true, email: true, fullName: true } } },
    });
    if (!q) return res.status(404).json({ message: 'Not found' });

    if (parsed.data.parentId) {
      const parent = await prisma.comment.findFirst({
        where: { id: parsed.data.parentId, questionId, deletedAt: null },
      });
      if (!parent) return res.status(400).json({ message: 'Parent comment not found' });
    }

    // 1. Tạo bản ghi bình luận mới và gộp kèm dữ liệu author để trả về frontend render luôn
    const c = await prisma.comment.create({
      data: {
        id: 'cmt_' + Date.now(),
        questionId,
        authorId: req.user!.id,
        content: parsed.data.content,
        parentId: parsed.data.parentId ?? null,
      },
      include: {
        author: { select: { id: true, fullName: true, role: true } }
      }
    });

    // 2. LOGIC BỔ TRỢ (NOTIFICATION + MAIL): Được cô lập hoàn toàn bằng try-catch cá nhân
    try {
      // Gửi chuông thông báo in-app (chỉ gửi nếu không phải tự mình bình luận bài của mình)
      if (q.authorId !== req.user!.id) {
        const u = req.user as any;
        const senderName = u?.fullName || u?.full_name || u?.email || 'Một thành viên';

        await prisma.notification.create({
          data: {
            id: 'noti_c_' + Date.now(),
            recipientId: q.authorId,
            senderId: req.user!.id,
            type: 'COMMENT',
            content: `${senderName} đã bình luận về bài viết của bạn`,
            targetId: questionId,
          },
        });
        console.log("=> [Notification] Đã ghi nhận thông báo bình luận thành công.");
      }

      // Gửi email thông báo chạy ngầm độc lập
      if (q.author.email) {
        void sendMail({
          to: q.author.email,
          subject: 'Có người trả lời bình luận/câu hỏi của bạn',
          html: `<p>Chào ${q.author.fullName || 'bạn'},</p><p>Có bình luận mới cho câu hỏi: <b>${q.title}</b></p>`,
        }).catch((mailErr) => {
          console.error('⚠️ [Mail ngầm] gửi mail thất bại (được tự động bỏ qua):', mailErr);
        });
      }
    } catch (subError) {
      console.error('⚠️ [Side-effects] Lỗi xử lý thông báo/mail phụ:', subError);
    }

    // 3. Trả về cấu trúc JSON chứa đầy đủ thực thể để giao diện nạp trực tiếp mà không cần F5
    return res.status(201).json({
      id: c.id,
      content: c.content,
      parentId: c.parentId,
      createdAt: c.createdAt.toISOString(),
      author: c.author,
      votes: { score: 0, userVote: 0 } // Giá trị điểm mặc định cho một bình luận mới tinh
    });

  } catch (globalError) {
    console.error("CRITICAL ERROR (Comment Route bị sập hoàn toàn):", globalError);
    return res.status(500).json({ error: "Lỗi hệ thống xử lý bình luận từ server" });
  }
});

// ============================================================
// 5. VOTE BÀI VIẾT
// ============================================================
router.post('/:id/vote', authRequired, async (req, res) => {
  const schema = z.object({ value: z.union([z.literal(-1), z.literal(0), z.literal(1)]) });
=======
  const questionId = String(req.params.id);
  const q = await prisma.question.findFirst({
    where: { id: questionId, deletedAt: null },
    include: { author: { select: { email: true, fullName: true } } },
  });

  if (!q) return res.status(404).json({ message: "Not found" });

  if (parsed.data.parentId) {
    const parent = await prisma.comment.findFirst({
      where: { id: parsed.data.parentId, questionId, deletedAt: null },
    });
    if (!parent)
      return res.status(400).json({ message: "Parent comment not found" });
  }

  const c = await prisma.comment.create({
    data: {
      questionId,
      authorId: req.user!.id,
      content: parsed.data.content,
      parentId: parsed.data.parentId ?? null,
    },
    include: {
      author: { select: { id: true, fullName: true, role: true } },
      votes: { select: { value: true, userId: true } },
    },
  });

  await sendMail({
    to: q.author.email,
    subject: "Có người trả lời bình luận/câu hỏi của bạn",
    html: `<p>Chào ${q.author.fullName},</p><p>Có bình luận mới cho câu hỏi: <b>${q.title}</b></p>`,
  });

  res.status(201).json(mapComment(c, req.user?.id));
});

// Vote
router.post("/:id/vote", authRequired, async (req, res) => {
  const schema = z.object({
    value: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
  });
>>>>>>> a75d423df4bad6686fee87e91111b3aa4814a2ce
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const questionId = String(req.params.id);
  const q = await prisma.question.findFirst({
    where: { id: questionId, deletedAt: null },
    select: { id: true },
  });
  if (!q) return res.status(404).json({ message: "Not found" });

<<<<<<< HEAD
  try {
    const q = await prisma.question.findFirst({ 
      where: { id: questionId, deletedAt: null }, 
      select: { id: true, authorId: true } 
    });
    if (!q) return res.status(404).json({ message: 'Not found' });

    const value = parsed.data.value;
    if (value === 0) {
      await prisma.vote.deleteMany({ where: { userId: req.user!.id, questionId } });
    } else {
      await prisma.vote.upsert({
        where: { userId_questionId: { userId: req.user!.id, questionId } },
        update: { value },
        create: { userId: req.user!.id, questionId, value },
      });

      // Tạo thông báo khi có người UPVOTE bài viết (value = 1)
      try {
        if (value === 1 && q.authorId !== req.user!.id) {
          const u = req.user as any;
          const senderName = u?.fullName || u?.full_name || u?.email || 'Một thành viên';

          await prisma.notification.create({
            data: {
              id: 'noti_vq_' + Date.now(),
              recipientId: q.authorId,
              senderId: req.user!.id,
              type: 'LIKE',
              content: `${senderName} đã thích bài viết của bạn`,
              targetId: questionId,
            }
          });
        }
      } catch (notifError) {
        console.error("⚠️ Lỗi ngầm khi tạo thông báo tương tác Vote bài viết:", notifError);
      }
    }
    return res.json({ ok: true });

  } catch (globalError) {
    console.error("CRITICAL ERROR (Vote Route sập):", globalError);
    return res.status(500).json({ error: "Lỗi hệ thống xử lý tương tác vote" });
  }
=======
  // Sử dụng transaction để đảm bảo tính toàn vẹn dữ liệu khi cập nhật vote và score
  await prisma.$transaction(async (tx) => {
    const value = parsed.data.value;

    // 1. Cập nhật hoặc xóa vote trong bảng votes
    if (value === 0) {
      await tx.vote.deleteMany({
        where: { userId: req.user!.id, questionId },
      });
    } else {
      await tx.vote.upsert({
        where: { userId_questionId: { userId: req.user!.id, questionId } },
        update: { value },
        create: { userId: req.user!.id, questionId, value },
      });
    }

    // 2. Tính lại tổng điểm (score) cho bài viết này
    const result = await tx.vote.aggregate({
      _sum: {
        value: true,
      },
      where: {
        questionId: questionId,
      },
    });
    const newScore = result._sum.value ?? 0;

    // 3. Cập nhật điểm mới vào bảng `posts`
    await tx.question.update({
      where: { id: questionId },
      data: { score: newScore },
    });
  });

  res.json({ ok: true });
>>>>>>> a75d423df4bad6686fee87e91111b3aa4814a2ce
});

export const questionsRouter = router;
