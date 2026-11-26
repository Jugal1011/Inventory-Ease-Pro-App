import nodemailer from "nodemailer";

/**
 * Custom error class for email failures.
 */
export class MailError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = "MailError";
    this.statusCode = 502;
    if (cause) this.cause = cause;
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
let transporterInstance = null;

/**
 * Escapes unsafe HTML characters.
 */
export function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

/**
 * Converts basic HTML to a clean plain text fallback.
 */
export function htmlToText(html = "") {
  return String(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h\d|div|li)>/gi, "\n\n")
    .replace(/<a [^>]*href="([^"]+)"[^>]*>[^<]*<\/a>/gi, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Builds transport configuration based on available environment variables.
 */
export function buildTransportOptions() {
  // 1. Explicit mock/json transport for testing
  if (process.env.MAIL_TRANSPORT === "json") {
    return { jsonTransport: true };
  }

  // 2. Custom SMTP host (SMTP_HOST or EMAIL_HOST)
  const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  if (smtpHost) {
    const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT) || 587;
    const secure = process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE === "true"
      : port === 465;

    const user = process.env.SMTP_USER || process.env.EMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

    return {
      host: smtpHost,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    };
  }

  // 3. Gmail OAuth2
  if (process.env.CLIENT_ID && process.env.REFRESH_TOKEN) {
    const user = process.env.EMAIL_USER;
    if (!user) {
      throw new MailError("Gmail OAuth2 requires EMAIL_USER to be set.");
    }
    return {
      service: "gmail",
      auth: {
        type: "OAuth2",
        user,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
      },
    };
  }

  // 4. Gmail with App Password (EMAIL_USER + EMAIL_PASS)
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return {
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    };
  }

  // 5. In test environment without explicit mail config, fallback to json transport
  if (process.env.NODE_ENV === "test") {
    return { jsonTransport: true };
  }

  throw new MailError(
    "Email service is not configured. Please configure Gmail OAuth2 (EMAIL_USER, CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN), SMTP (SMTP_HOST / EMAIL_HOST), or EMAIL_USER with an App Password."
  );
}

/**
 * Gets or creates the nodemailer transporter instance.
 */
export function getTransporter(options = {}) {
  if (options.forceNew || !transporterInstance) {
    transporterInstance = nodemailer.createTransport(buildTransportOptions());
  }
  return transporterInstance;
}

/**
 * Overrides or resets the transporter (primarily for testing).
 */
export function setTransporter(customTransporter = null) {
  transporterInstance = customTransporter;
}

/**
 * Determines the 'From' address.
 */
export function resolveFromAddress(customFrom) {
  if (customFrom && String(customFrom).trim()) {
    return String(customFrom).trim();
  }
  const address =
    process.env.EMAIL_FROM ||
    process.env.EMAIL_USER ||
    process.env.SMTP_USER;

  if (!address) {
    throw new MailError(
      "Email sender is not configured. Set EMAIL_FROM, EMAIL_USER, or SMTP_USER."
    );
  }

  return address.includes("<") ? address : `InventoryEasePro <${address}>`;
}

/**
 * Sends an email supporting BOTH:
 *  - Positional signature: sendEmail(subject, message, send_to, [sent_from, reply_to])
 *  - Object signature: sendEmail({ to, subject, html, text, from, replyTo })
 *
 * @returns {Promise<{messageId: string, accepted: string[], rejected: string[], response?: any}>}
 */
export async function sendEmail(firstArg, ...rest) {
  let to, subject, html, text, from, replyTo;

  if (typeof firstArg === "object" && firstArg !== null) {
    ({ to, subject, html, text, from, replyTo } = firstArg);
  } else {
    // Positional signature: (subject, message, send_to, sent_from, reply_to)
    const [message, send_to, sent_from, custom_reply_to] = rest;
    subject = firstArg;
    html = message;
    to = send_to;
    from = sent_from;
    replyTo = custom_reply_to;
  }

  // Validation
  if (!to || !EMAIL_RE.test(String(to).trim())) {
    throw new MailError("Recipient email address is invalid");
  }
  if (!subject || !String(subject).trim()) {
    throw new MailError("Email subject is required");
  }
  if (!html && !text) {
    throw new MailError("Email body is required");
  }

  const cleanSubject = String(subject).replace(/[\r\n]+/g, " ").trim().slice(0, 200);
  const plainText = text ?? (html ? htmlToText(html) : "");
  const sender = resolveFromAddress(from);

  const mailOptions = {
    from: sender,
    to: String(to).trim(),
    subject: cleanSubject,
    html: html ?? `<p style="white-space:pre-wrap">${escapeHtml(text)}</p>`,
    text: plainText,
  };

  if (replyTo) {
    mailOptions.replyTo = String(replyTo).trim();
  }

  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail(mailOptions);

    if (info.rejected && info.rejected.length > 0) {
      throw new MailError("Email address was rejected by the mail server", info);
    }

    console.log("Email sent successfully:", info.messageId || "ok");
    return info;
  } catch (error) {
    // Drop cached instance so token/connection can recover on retry
    transporterInstance = null;
    if (error instanceof MailError) {
      throw error;
    }
    console.error(`[mail] send to ${to} failed:`, error.message);
    throw new MailError(
      `Email could not be delivered: ${error.message}`,
      error
    );
  }
}

/**
 * Checks connection / transport readiness.
 */
export async function verifyMailer() {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log("Mail transport ready");
    return true;
  } catch (err) {
    console.warn(`Mail transport not ready: ${err.message}`);
    transporterInstance = null;
    return false;
  }
}

/**
 * Branded responsive HTML email layout for transactional emails.
 */
export function emailTemplate({ heading, body, ctaUrl, ctaLabel }) {
  const safeUrl = escapeHtml(ctaUrl || "");
  return `
  <div style="font-family:Inter,Arial,sans-serif;background:#0b1020;padding:32px;color:#e5e7eb">
    <div style="max-width:520px;margin:auto;background:#111831;border:1px solid #1f2a52;border-radius:16px;padding:32px">
      <h2 style="margin:0 0 12px;color:#fff">${escapeHtml(heading)}</h2>
      <p style="line-height:1.6;color:#cbd5e1">${body}</p>
      ${ctaUrl
      ? `<p style="margin:28px 0"><a href="${safeUrl}" style="background:linear-gradient(135deg,#6366f1,#22d3ee);color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600">${escapeHtml(
        ctaLabel || "Click here"
      )}</a></p>
             <p style="font-size:12px;color:#94a3b8">If the button does not work, paste this link into your browser:<br>${safeUrl}</p>`
      : ""
    }
      <p style="margin-top:28px;color:#94a3b8">— InventoryEasePro Team</p>
    </div>
  </div>`;
}

export default sendEmail;
