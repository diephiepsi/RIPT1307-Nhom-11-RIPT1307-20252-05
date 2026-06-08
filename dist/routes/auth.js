"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const db_1 = require("../db");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    fullName: zod_1.z.string().min(2),
    role: zod_1.z.enum(['STUDENT', 'LECTURER']),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
function signToken(payload) {
    const secret = process.env.JWT_SECRET ?? '';
    return jsonwebtoken_1.default.sign(payload, secret, { expiresIn: '7d' });
}
router.post('/register', async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json(parsed.error.flatten());
    const { email, password, fullName, role } = parsed.data;
    const exists = await db_1.prisma.user.findUnique({ where: { email } });
    if (exists)
        return res.status(409).json({ message: 'Email này đã được sử dụng' });
    const hashed = await bcryptjs_1.default.hash(password, 10);
    const user = await db_1.prisma.user.create({
        data: { email, password: hashed, fullName, role },
        select: { id: true, email: true, fullName: true, role: true, locked: true },
    });
    const token = signToken({ id: user.id, role: user.role, email: user.email });
    res.json({ token, user });
});
router.post('/login', async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json(parsed.error.flatten());
    const { email, password } = parsed.data;
    const user = await db_1.prisma.user.findUnique({ where: { email } });
    if (!user)
        return res.status(401).json({ message: 'Tài khoản không tồn tại' });
    // Kiểm tra khóa tài khoản lúc đăng nhập
    if (user.locked)
        return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa bởi Quản trị viên' });
    const ok = await bcryptjs_1.default.compare(password, user.password);
    if (!ok)
        return res.status(401).json({ message: 'Mật khẩu không chính xác' });
    const token = signToken({ id: user.id, role: user.role, email: user.email });
    res.json({
        token,
        user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, locked: user.locked },
    });
});
router.get('/me', auth_1.authRequired, async (req, res) => {
    const user = await db_1.prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, email: true, fullName: true, role: true, locked: true },
    });
    if (!user)
        return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    // NÂNG CẤP: Chặn luôn truy cập nếu Token còn hạn nhưng tài khoản đã bị Admin khóa
    if (user.locked)
        return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa' });
    res.json(user);
});
exports.authRouter = router;
