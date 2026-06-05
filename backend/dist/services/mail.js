"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = sendMail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? "587"),
  secure: false,
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    : undefined,
});
async function sendMail(opts) {
  if (!process.env.SMTP_HOST || !process.env.MAIL_FROM) {
    console.log("[mail] skipped (missing SMTP_HOST/MAIL_FROM)", {
      to: opts.to,
      subject: opts.subject,
    });
    return;
  }
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
}
