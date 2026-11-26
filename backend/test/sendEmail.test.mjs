import assert from "node:assert/strict";
import nodemailer from "nodemailer";
import sendEmail, {
  sendEmail as namedSendEmail,
  MailError,
  escapeHtml,
  htmlToText,
  emailTemplate,
  buildTransportOptions,
  getTransporter,
  setTransporter,
  resolveFromAddress,
  verifyMailer,
} from "../utils/sendEmail.js";

import {
  sendEmail as mailerSendEmail,
  emailTemplate as mailerEmailTemplate,
  escapeHtml as mailerEscapeHtml,
} from "../src/utils/mailer.js";

let testsRun = 0;
let testsPassed = 0;

async function test(name, fn) {
  testsRun++;
  try {
    await fn();
    testsPassed++;
    console.log(`✓ ${name}`);
  } catch (err) {
    console.error(`✗ ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

console.log("--- Starting sendEmail & mailer test suite ---");

// 1. Validation tests
await test("rejects invalid recipient email address", async () => {
  await assert.rejects(
    () => sendEmail("Subject", "<p>Message</p>", "invalid-email"),
    (err) => err instanceof MailError && /Recipient email address is invalid/i.test(err.message)
  );
});

await test("rejects missing recipient in object signature", async () => {
  await assert.rejects(
    () => sendEmail({ subject: "Subject", html: "<p>Message</p>" }),
    (err) => err instanceof MailError && /Recipient email address is invalid/i.test(err.message)
  );
});

await test("rejects missing subject", async () => {
  await assert.rejects(
    () => sendEmail("", "<p>Message</p>", "test@example.com"),
    (err) => err instanceof MailError && /Email subject is required/i.test(err.message)
  );
});

await test("rejects missing body", async () => {
  await assert.rejects(
    () => sendEmail("Subject", "", "test@example.com"),
    (err) => err instanceof MailError && /Email body is required/i.test(err.message)
  );
});

// 2. Helper functions tests
await test("escapeHtml escapes HTML entities correctly", () => {
  const input = `<script>alert("XSS & 'bad'");</script>`;
  const expected = `&lt;script&gt;alert(&quot;XSS &amp; &#39;bad&#39;&quot;);&lt;/script&gt;`;
  assert.equal(escapeHtml(input), expected);
});

await test("htmlToText converts html tags to plain text correctly", () => {
  const html = `<h2>Hello World</h2><p>This is a <a href="https://example.com">link</a>.</p><br/>Next line &amp; more.`;
  const text = htmlToText(html);
  assert.ok(text.includes("Hello World"));
  assert.ok(text.includes("https://example.com"));
  assert.ok(text.includes("& more"));
  assert.ok(!text.includes("<p>"));
  assert.ok(!text.includes("<h2>"));
});

await test("emailTemplate generates responsive branded html", () => {
  const html = emailTemplate({
    heading: "Verify Your Account",
    body: "Please click below to verify your email.",
    ctaUrl: "https://example.com/verify?token=123",
    ctaLabel: "Verify Now",
  });
  assert.ok(html.includes("Verify Your Account"));
  assert.ok(html.includes("Please click below to verify your email."));
  assert.ok(html.includes("https://example.com/verify?token=123"));
  assert.ok(html.includes("Verify Now"));
  assert.ok(html.includes("InventoryEasePro Team"));
});

// 3. Sender address resolution
await test("resolveFromAddress uses custom from if provided", () => {
  const from = resolveFromAddress("Custom Sender <custom@example.com>");
  assert.equal(from, "Custom Sender <custom@example.com>");
});

await test("resolveFromAddress formats plain email with app name", () => {
  const prevEnv = process.env.EMAIL_FROM;
  process.env.EMAIL_FROM = "system@example.com";
  try {
    const from = resolveFromAddress();
    assert.equal(from, "InventoryEasePro <system@example.com>");
  } finally {
    process.env.EMAIL_FROM = prevEnv;
  }
});

// 4. Transport building options
await test("buildTransportOptions supports jsonTransport", () => {
  const prev = process.env.MAIL_TRANSPORT;
  process.env.MAIL_TRANSPORT = "json";
  try {
    const opts = buildTransportOptions();
    assert.equal(opts.jsonTransport, true);
  } finally {
    process.env.MAIL_TRANSPORT = prev;
  }
});

await test("buildTransportOptions supports SMTP config", () => {
  const prevHost = process.env.SMTP_HOST;
  const prevPort = process.env.SMTP_PORT;
  process.env.SMTP_HOST = "smtp.mailtrap.io";
  process.env.SMTP_PORT = "2525";
  try {
    const opts = buildTransportOptions();
    assert.equal(opts.host, "smtp.mailtrap.io");
    assert.equal(opts.port, 2525);
  } finally {
    process.env.SMTP_HOST = prevHost;
    process.env.SMTP_PORT = prevPort;
  }
});

await test("buildTransportOptions supports Gmail OAuth2", () => {
  const prevHost = process.env.SMTP_HOST;
  const prevClient = process.env.CLIENT_ID;
  const prevSecret = process.env.CLIENT_SECRET;
  const prevToken = process.env.REFRESH_TOKEN;
  const prevUser = process.env.EMAIL_USER;

  delete process.env.SMTP_HOST;
  process.env.CLIENT_ID = "mock-client-id";
  process.env.CLIENT_SECRET = "mock-secret";
  process.env.REFRESH_TOKEN = "mock-refresh-token";
  process.env.EMAIL_USER = "mock-user@gmail.com";

  try {
    const opts = buildTransportOptions();
    assert.equal(opts.service, "gmail");
    assert.equal(opts.auth.type, "OAuth2");
    assert.equal(opts.auth.user, "mock-user@gmail.com");
    assert.equal(opts.auth.clientId, "mock-client-id");
  } finally {
    process.env.SMTP_HOST = prevHost;
    process.env.CLIENT_ID = prevClient;
    process.env.CLIENT_SECRET = prevSecret;
    process.env.REFRESH_TOKEN = prevToken;
    process.env.EMAIL_USER = prevUser;
  }
});

// 5. Delivery test using mock jsonTransport
await test("sends email successfully using positional signature", async () => {
  const testTransporter = nodemailer.createTransport({ jsonTransport: true });
  setTransporter(testTransporter);

  process.env.EMAIL_USER = "noreply@inventoryease.com";

  const result = await sendEmail(
    "Welcome to InventoryEase",
    "<h2>Welcome</h2><p>Glad to have you aboard.</p>",
    "customer@example.com"
  );

  assert.ok(result.messageId);
  const parsed = JSON.parse(result.message);
  assert.equal(parsed.to[0].address, "customer@example.com");
  assert.equal(parsed.subject, "Welcome to InventoryEase");
  assert.ok(parsed.html.includes("Glad to have you aboard."));
  assert.ok(parsed.text.includes("Glad to have you aboard."));
});

await test("sends email successfully using object signature with replyTo and custom from", async () => {
  const testTransporter = nodemailer.createTransport({ jsonTransport: true });
  setTransporter(testTransporter);

  const result = await sendEmail({
    to: "warehouse@example.com",
    from: "Notifications <alerts@inventoryease.com>",
    subject: "Low Stock Alert\r\n(Urgent)",
    html: "<p>Item #45 is low on stock.</p>",
    replyTo: "support@inventoryease.com",
  });

  assert.ok(result.messageId);
  const parsed = JSON.parse(result.message);
  assert.equal(parsed.to[0].address, "warehouse@example.com");
  assert.equal(parsed.from.address, "alerts@inventoryease.com");
  assert.equal(parsed.replyTo[0].address, "support@inventoryease.com");
  // Check CRLF header sanitization
  assert.equal(parsed.subject, "Low Stock Alert (Urgent)");
});

// 6. Verify compatibility with backend/src/utils/mailer.js re-export
await test("backend/src/utils/mailer.js re-exports and behaves identically", async () => {
  const testTransporter = nodemailer.createTransport({ jsonTransport: true });
  setTransporter(testTransporter);

  const result = await mailerSendEmail({
    to: "user@test.dev",
    subject: "Confirm your email",
    html: mailerEmailTemplate({
      heading: "Confirm email",
      body: "Click to confirm",
      ctaUrl: "http://localhost:3000/confirm/123",
      ctaLabel: "Confirm",
    }),
  });

  assert.ok(result.messageId);
  const parsed = JSON.parse(result.message);
  assert.equal(parsed.to[0].address, "user@test.dev");
  assert.equal(parsed.subject, "Confirm your email");
  assert.ok(parsed.html.includes("http://localhost:3000/confirm/123"));
});

console.log(`\nResults: ${testsPassed}/${testsRun} tests passed.`);
if (testsPassed === testsRun) {
  console.log("All tests passed successfully!");
} else {
  process.exit(1);
}

