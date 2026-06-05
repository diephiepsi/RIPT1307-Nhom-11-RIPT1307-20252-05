"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRoutes = void 0;
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../middlewares/auth");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const notificationResponseSchema = zod_1.z.object({
  id: zod_1.z.string(),
  recipientId: zod_1.z.string(),
  senderId: zod_1.z.string(),
  type: zod_1.z.string(),
  content: zod_1.z.string(),
  targetId: zod_1.z.string(),
  isRead: zod_1.z.boolean(),
  createdAt: zod_1.z.date(),
});
const notificationListResponseSchema = zod_1.z.array(
  notificationResponseSchema,
);
router.get("/", auth_1.authRequired, async (req, res) => {
  try {
    const userId = req.user.id;
    const list = await db_1.prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    const validatedData = notificationListResponseSchema.parse(list);
    res.json(validatedData);
  } catch (error) {
    if (error instanceof zod_1.z.ZodError) {
      return res
        .status(400)
        .json({ message: "Dữ liệu không hợp lệ", errors: error.flatten() });
    }
    res.status(500).json({ message: "Lỗi server khi lấy thông báo" });
  }
});
router.post("/read-all", auth_1.authRequired, async (req, res) => {
  try {
    const userId = req.user.id;
    await db_1.prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});
exports.notificationRoutes = router;
