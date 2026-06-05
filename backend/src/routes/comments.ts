import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { authRequired } from "../middlewares/auth";

const router = Router();

router.post("/:id/vote", authRequired, async (req, res) => {
  const schema = z.object({
    value: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const commentId = String(req.params.id);

  try {
    const c = await prisma.comment.findFirst({
      where: { id: commentId, deletedAt: null },
      select: { id: true, authorId: true, questionId: true },
    });
    if (!c) return res.status(404).json({ message: "Not found" });

    const value = parsed.data.value;
    if (value === 0) {
      await prisma.vote.deleteMany({
        where: { userId: req.user!.id, commentId },
      });
    } else {
      await prisma.vote.upsert({
        where: { userId_commentId: { userId: req.user!.id, commentId } },
        update: { value },
        create: { userId: req.user!.id, commentId, value },
      });

      try {
        if (value === 1 && c.authorId !== req.user!.id) {
          // Ép kiểu or fallback linh hoạt phòng trường hợp JwtUser khai báo thiếu trường ở các file gõ khác nhau
          const u = req.user as any;
          const senderName =
            u?.full_name || u?.fullName || u?.email || "Một thành viên";

          await prisma.notification.create({
            data: {
              id:
                "noti_v_" +
                Date.now() +
                Math.random().toString(36).substring(2, 5),
              recipientId: c.authorId,
              senderId: req.user!.id,
              type: "LIKE",
              content: `${senderName} đã thích bình luận của bạn`,
              targetId: c.questionId,
            },
          });
          console.log("=> [Notification] Đã tạo thông báo LIKE bình luận.");
        }
      } catch (notifError) {
        // Lỗi tạo thông báo chỉ in ra terminal debug, không block luồng vote chính
        console.error(
          "⚠️ Lỗi ngầm khi tạo thông báo tương tác Vote:",
          notifError,
        );
      }
    }
    return res.json({ ok: true });
  } catch (globalError) {
    console.error("CRITICAL ERROR (Vote sập):", globalError);
    return res.status(500).json({ error: "Lỗi hệ thống xử lý vote" });
  }
});

router.post("/", authRequired, async (req, res) => {
  const commentSchema = z.object({
    content: z.string().min(1),
    postId: z.string(), // postId gửi từ frontend lên
  });

  const parsed = commentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const { content, postId } = parsed.data;

  try {
    // 1. Tạo bản ghi bình luận mới (Luôn được ưu tiên xử lý trước)
    const newComment = await prisma.comment.create({
      data: {
        id: "cmt_" + Date.now(),
        content,
        questionId: postId,
        authorId: req.user!.id,
      },
    });

    try {
      const question = await prisma.question.findFirst({
        where: { id: postId, deletedAt: null },
      });
      if (question && question.authorId !== req.user!.id) {
        const u = req.user as any;
        const senderName =
          u?.full_name || u?.fullName || u?.email || "Một thành viên";

        await prisma.notification.create({
          data: {
            id: "noti_c_" + Date.now(),
            recipientId: question.authorId,
            senderId: req.user!.id,
            type: "COMMENT",
            content: `${senderName} đã bình luận về bài viết của bạn`,
            targetId: postId,
          },
        });
        console.log("=> [Notification] Đã tạo thông báo COMMENT bài viết.");
      }
    } catch (notifError) {
      // Nếu phần thông báo gãy (ví dụ database chưa đồng bộ kịp model), comment vẫn chạy bình thường
      console.error(
        "⚠️ Lỗi ngầm khi tạo thông báo bình luận bài viết:",
        notifError,
      );
    }

    // Luôn trả về dữ liệu bình luận thành công cho Frontend
    return res.json(newComment);
  } catch (globalError) {
    console.error("CRITICAL ERROR (Comment sập):", globalError);
    return res.status(500).json({ error: "Lỗi hệ thống xử lý bình luận" });
  }
});

export const commentsRouter = router;
