import nodemailer from "nodemailer";

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
}) {
  // Không cấu hình SMTP thì bỏ qua, không làm hỏng chức năng chính như comment/reply.
  if (!process.env.SMTP_HOST || !process.env.MAIL_FROM) {
    console.log("[mail] skipped: missing SMTP_HOST or MAIL_FROM", {
      to: opts.to,
      subject: opts.subject,
    });
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? "587"),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
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
  } catch (err: any) {
    // Quan trọng: không throw nữa. SMTP lỗi thì chỉ log, comment/reply vẫn thành công.
    console.error("[mail] send failed but ignored:", err?.message || err);
  }
}
