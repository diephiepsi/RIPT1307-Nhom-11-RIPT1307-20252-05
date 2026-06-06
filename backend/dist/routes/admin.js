"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const db_1 = require("../db");
const auth_1 = require("../middlewares/auth");
const requireRole_1 = require("../middlewares/requireRole");
const mail_1 = require("../services/mail");
const router = (0, express_1.Router)();
// Middleware bảo vệ toàn bộ route của Admin
router.use(auth_1.authRequired, (0, requireRole_1.requireRole)(['ADMIN']));
// 1. Quản lý Bài đăng
router.get('/posts', async (_req, res) => {
    const posts = await db_1.prisma.question.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        include: {
            author: true,
            votes: { select: { value: true } },
            tags: { include: { tag: true } } // MỚI THÊM: Lấy thông tin bảng tags
        },
    });
    res.json(posts.map((p) => ({
        id: p.id,
        title: p.title,
        content: p.content, // MỚI THÊM: Trả về nội dung bài viết
        tags: p.tags.map((t) => t.tag.name), // MỚI THÊM: Trả về mảng chứa tên các tag
        createdAt: p.createdAt.toISOString(),
        authorName: p.author.fullName,
        isApproved: p.isApproved,
        score: p.votes.reduce((acc, v) => acc + (v.value > 0 ? 1 : v.value < 0 ? -1 : 0), 0),
    })));
});
// API MỚI: Phê duyệt bài đăng
router.patch('/posts/:id/approve', async (req, res) => {
    const id = req.params.id;
    await db_1.prisma.question.update({
        where: { id },
        data: { isApproved: true }
    }).catch(() => null);
    res.json({ ok: true, message: 'Đã duyệt bài viết' });
});
router.delete('/posts/:id', async (req, res) => {
    const id = req.params.id;
    await db_1.prisma.question.update({ where: { id }, data: { deletedAt: new Date() } }).catch(() => null);
    res.json({ ok: true });
});
// 2. Quản lý Người dùng
router.get('/users', async (_req, res) => {
    const users = await db_1.prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(users.map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        locked: u.locked, // Trạng thái khóa
        createdAt: u.createdAt.toISOString(),
    })));
});
// Thêm mới người dùng
const createUserSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    fullName: zod_1.z.string().min(2),
    password: zod_1.z.string().min(6),
    role: zod_1.z.enum(['STUDENT', 'LECTURER', 'ADMIN']),
});
router.post('/users', async (req, res) => {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json(parsed.error.flatten());
    const { email, fullName, password, role } = parsed.data;
    const exists = await db_1.prisma.user.findUnique({ where: { email } });
    if (exists)
        return res.status(409).json({ message: 'Email already exists' });
    const hashed = await bcryptjs_1.default.hash(password, 10);
    const u = await db_1.prisma.user.create({ data: { email, fullName, password: hashed, role } });
    res.status(201).json({ id: u.id });
});
// Cập nhật người dùng
router.patch('/users/:id', async (req, res) => {
    const schema = zod_1.z.object({
        locked: zod_1.z.boolean().optional(),
        fullName: zod_1.z.string().min(2).optional(),
        role: zod_1.z.enum(['STUDENT', 'LECTURER', 'ADMIN']).optional()
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json(parsed.error.flatten());
    const id = req.params.id;
    await db_1.prisma.user.update({ where: { id }, data: parsed.data }).catch(() => null);
    res.json({ ok: true });
});
// Xóa người dùng
router.delete('/users/:id', async (req, res) => {
    const id = req.params.id;
    await db_1.prisma.user.delete({ where: { id } }).catch(() => null);
    res.json({ ok: true });
});
// Cấp lại mật khẩu
router.post('/users/:id/reset-password', async (req, res) => {
    const id = req.params.id;
    const user = await db_1.prisma.user.findUnique({ where: { id } });
    if (!user)
        return res.status(404).json({ message: 'Not found' });
    // Đặt cứng mật khẩu là 123456
    const newPass = '123456';
    const hashed = await bcryptjs_1.default.hash(newPass, 10);
    await db_1.prisma.user.update({ where: { id }, data: { password: hashed } });
    // Gửi email thông báo
    await (0, mail_1.sendMail)({
        to: user.email,
        subject: 'Thông báo: Cấp lại mật khẩu Diễn đàn',
        html: `
      <h3>Chào ${user.fullName},</h3>
      <p>Tài khoản của bạn đã được quản trị viên cấp lại mật khẩu.</p>
      <p>Mật khẩu mới của bạn là: <b>${newPass}</b></p>
      <p>Vui lòng đăng nhập và tiến hành đổi mật khẩu mới để đảm bảo an toàn.</p>
    `,
    }).catch(err => console.error("Lỗi gửi mail:", err));
    res.json({ ok: true });
});
// 3. Thống kê hệ thống
router.get('/stats', async (_req, res) => {
    try {
        const totalUsers = await db_1.prisma.user.count();
        const totalPosts = await db_1.prisma.question.count({ where: { deletedAt: null } });
        const pendingPosts = await db_1.prisma.question.count({ where: { deletedAt: null, isApproved: false } });
        const totalComments = await db_1.prisma.comment.count({ where: { deletedAt: null } });
        res.json({
            totalUsers,
            totalPosts,
            pendingPosts,
            totalComments
        });
    }
    catch (error) {
        console.error("[GET /admin/stats] error:", error);
        res.status(500).json({ message: "Lỗi lấy thống kê" });
    }
});
exports.adminRouter = router;
