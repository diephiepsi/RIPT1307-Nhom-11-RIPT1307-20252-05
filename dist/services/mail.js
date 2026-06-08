"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = sendMail;
const nodemailer_1 = __importDefault(require("nodemailer"));
async function sendMail(opts) {
    // Không cấu hình SMTP thì bỏ qua, không làm hỏng chức năng chính như comment/reply.
    if (!process.env.SMTP_HOST || !process.env.MAIL_FROM) {
        console.log("[mail] skipped: missing SMTP_HOST or MAIL_FROM", {
            to: opts.to,
            subject: opts.subject,
        });
        return;
    }
    try {
        const transporter = nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT ?? "587"),
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: process.env.SMTP_USER && process.env.SMTP_PASS
                ? {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                }
                : undefined,
        });
        await transporter.sendMail({
            from: process.env.MAIL_FROM,
            to: opts.to,
            subject: opts.subject,
            html: opts.html,
        });
    }
    catch (err) {
        // Quan trọng: không throw nữa. SMTP lỗi thì chỉ log, comment/reply vẫn thành công.
        console.error("[mail] send failed but ignored:", err?.message || err);
    }
}
