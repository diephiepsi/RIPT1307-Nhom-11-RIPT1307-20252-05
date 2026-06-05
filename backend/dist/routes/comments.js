"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db"); // Đảm bảo import đúng thực thể prisma từ utils/db.ts
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
// ============================================================
// 1. ROUTE VOTE BÌNH LUẬN (TỰ ĐỘNG TẠO THÔNG BÁO KHI UPVOTE)
// ============================================================
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
  const commentId = String(req.params.id);
  // Gọi đúng model 'comment' theo schema.prisma của bạn
  // Lấy thêm 'authorId' (chủ bình luận) và 'questionId' (bài viết chứa bình luận)
  const c = await db_1.prisma.comment.findFirst({
    where: { id: commentId, deletedAt: null },
    select: { id: true, authorId: true, questionId: true },
  });
  if (!c) return res.status(404).json({ message: "Not found" });
  const value = parsed.data.value;
  if (value === 0) {
    await db_1.prisma.vote.deleteMany({
      where: { userId: req.user.id, commentId },
    });
  } else {
    await db_1.prisma.vote.upsert({
      where: { userId_commentId: { userId: req.user.id, commentId } },
      update: { value },
      create: { userId: req.user.id, commentId, value },
    });
    // --- LOGIC TẠO THÔNG BÁO KHI CÓ NGƯỜI UPVOTE (VALUE = 1) ---
    // Thông báo cho chủ bình luận nếu người vote không phải là chính họ
    if (value === 1 && c.authorId !== req.user.id) {
      await db_1.prisma.notification.create({
        data: {
          id:
            "noti_v_" + Date.now() + Math.random().toString(36).substring(2, 5),
          recipientId: c.authorId, // Chuẩn tên trường recipientId
          senderId: req.user.id,
          type: "LIKE",
          content: `${req.user.full_name} đã thích bình luận của bạn`, // Khớp với trường full_name của JwtUser
          targetId: c.questionId, // Chuẩn tên trường targetId (lưu questionId để frontend redirect)
        },
      });
    }
  }
  res.json({ ok: true });
});
// ============================================================
// 2. ROUTE TẠO BÌNH LUẬN MỚI (TỰ ĐỘNG TẠO THÔNG BÁO CHO CHỦ BÀI VIẾT)
// ============================================================
router.post("/", auth_1.authRequired, async (req, res) => {
  const commentSchema = zod_1.z.object({
    content: zod_1.z.string().min(1),
    postId: zod_1.z.string(), // postId gửi từ frontend lên
  });
  const parsed = commentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const { content, postId } = parsed.data;
  // 1. Tạo bản ghi bình luận mới (gọi trúng model comment, map trúng trường questionId và authorId)
  const newComment = await db_1.prisma.comment.create({
    data: {
      id: "cmt_" + Date.now(),
      content,
      questionId: postId,
      authorId: req.user.id,
    },
  });
  // 2. Tìm thông tin bài viết gốc bằng model 'question' (Khớp chuẩn schema.prisma của bạn)
  const question = await db_1.prisma.question.findFirst({
    where: { id: postId, deletedAt: null },
  });
  // 3. Nếu tìm thấy bài viết và người bình luận không phải là chủ bài viết (authorId) -> Tạo thông báo
  if (question && question.authorId !== req.user.id) {
    await db_1.prisma.notification.create({
      data: {
        id: "noti_c_" + Date.now(),
        recipientId: question.authorId, // Người nhận: Chủ bài viết (authorId của Question)
        senderId: req.user.id, // Người gửi: Người vừa bình luận
        type: "COMMENT",
        content: `${req.user.full_name} đã bình luận về bài viết của bạn`,
        targetId: postId,
      },
    });
  }
  res.json(newComment);
});
exports.commentsRouter = router;
