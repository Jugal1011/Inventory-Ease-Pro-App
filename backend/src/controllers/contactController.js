import { AppError } from "../utils/AppError.js";
import { sendEmail, escapeHtml } from "../utils/mailer.js";

export async function contactUs(req, res) {
  const { subject, message } = req.body ?? {};
  if (!subject || !message) throw new AppError("Please add subject and message", 400);

  const { name, email } = req.user;
  await sendEmail({
    to: process.env.CONTACT_EMAIL || process.env.EMAIL_USER || process.env.SMTP_USER,
    subject: `[Inventory App] ${String(subject).slice(0, 150)}`,
    replyTo: email, // reply goes straight to the user who wrote in
    html: `<p><b>From:</b> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
           <p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
    text: `From: ${name} <${email}>\n\n${message}`,
  });

  res.json({ success: true, message: "Message sent. We'll get back to you soon." });
}
