import { Router } from "express";
import { prisma } from "../db";
import { authRequired } from "../middlewares/auth";
import { z } from "zod";

const router = Router();

const notificationResponseSchema = z.object({
  id: z.string(),
  recipientId: z.string(),
  senderId: z.string(),
  type: z.string(),
  content: z.string(),
  targetId: z.string(),
  isRead: z.boolean(),
  createdAt: z.date(),
});

const notificationListResponseSchema = z.array(notificationResponseSchema);

router.get("/", authRequired, async (req: any, res) => {
  try {
    const userId = req.user.id;

    const list = await prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const validatedData = notificationListResponseSchema.parse(list);
    res.json(validatedData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Dữ liệu không hợp lệ", errors: error.flatten() });
    }
    res.status(500).json({ message: "Lỗi server khi lấy thông báo" });
  }
});

router.post("/read-all", authRequired, async (req: any, res) => {
  try {
    const userId = req.user.id;

    await prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

export const notificationRoutes = router;
