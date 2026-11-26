import fs from "node:fs";
const BASE = "http://127.0.0.1:5055";
const INBOX = process.env.MAIL_INBOX || "/tmp/inbox.json";
let pass = 0, fail = 0;
const ok = (name, cond, extra = "") => { cond ? pass++ : fail++; console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? "  — " + extra : ""}`); };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function mailFor(to, pattern, { after = 0, tries = 20 } = {}) {
  for (let i = 0; i < tries; i++) {
    if (fs.existsSync(INBOX)) {
      const msgs = JSON.parse(fs.readFileSync(INBOX, "utf8")).slice(after);
      for (const m of msgs.reverse()) {
        if (m.to.includes(to)) {
          const hit = m.text.match(pattern);
          if (hit) return { text: m.text, token: hit[1], subject: m.subject, reply_to: m.reply_to };
        }
      }
    }
    await sleep(250);
  }
  return null;
}
const mailCount = () => (fs.existsSync(INBOX) ? JSON.parse(fs.readFileSync(INBOX, "utf8")).length : 0);

async function call(method, path, { body, cookie, form, raw } = {}) {
  const headers = {};
  if (cookie) headers.cookie = cookie;
  let payload;
  if (form) payload = form;
  else if (raw !== undefined) { headers["content-type"] = "application/json"; payload = raw; }
  else if (body !== undefined) { headers["content-type"] = "application/json"; payload = JSON.stringify(body); }
  const res = await fetch(BASE + path, { method, headers, body: payload, redirect: "manual" });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  const setCookie = res.headers.get("set-cookie") || "";
  const sess = setCookie.match(/token=([^;]+)/);
  return { status: res.status, json, cookie: sess ? `token=${sess[1]}` : null, setCookie };
}

const strong = "Str0ng!Pass";

// ---- 1. Registration + verification ----
let r = await call("POST", "/api/users/register", { body: { name: "Asha <b>Rao</b>", email: "asha@test.dev", password: strong } });
ok("register returns 201", r.status === 201, JSON.stringify(r.json).slice(0, 120));
const confirmMail = await mailFor("asha@test.dev", /confirm-email\/([a-f0-9]{64})/);
ok("verification email delivered", !!confirmMail, confirmMail?.subject);
ok("registration email escapes name (no raw <b> tag)", confirmMail && !confirmMail.text.includes("<b>"));

r = await call("POST", "/api/users/register", { body: { name: "Dup", email: "asha@test.dev", password: strong } });
ok("duplicate email rejected with 409", r.status === 409, r.json?.message);

r = await call("POST", "/api/users/register", { body: { name: "Weak", email: "weak@test.dev", password: "abc" } });
ok("weak password rejected with 400", r.status === 400, r.json?.message?.slice(0, 60));

const beforeLogin = mailCount();
r = await call("POST", "/api/users/login", { body: { email: "asha@test.dev", password: strong } });
ok("login before verify → 403", r.status === 403, r.json?.message);
const resend = await mailFor("asha@test.dev", /confirm-email\/([a-f0-9]{64})/, { after: beforeLogin });
ok("unverified login re-sends verification email", !!resend);

r = await call("PUT", `/api/users/confirmEmail/${confirmMail.token}`);
// The first token was replaced by the resend, so it must now be invalid (single active token)
ok("older verification token is invalidated", r.status === 404, r.json?.message);

r = await call("PUT", `/api/users/confirmEmail/${resend.token}`);
ok("confirm email with latest token → 200", r.status === 200, r.json?.message);
r = await call("PUT", `/api/users/confirmEmail/${resend.token}`);
ok("confirm token is single-use", r.status === 404);

r = await call("POST", "/api/users/login", { body: { email: "asha@test.dev", password: "wrong" } });
ok("wrong password → 401", r.status === 401);

r = await call("POST", "/api/users/login", { body: { email: "ASHA@test.dev", password: strong } });
ok("login succeeds (email case-insensitive)", r.status === 200 && !!r.cookie, r.json?.message);
const cookie = r.cookie;
ok("login sets httpOnly session cookie", /HttpOnly/i.test(r.setCookie) && /SameSite=Lax/i.test(r.setCookie));

// ---- 2. Session ----
r = await call("GET", "/api/users/loggedin", { cookie });
ok("loggedin → true with cookie", r.json === true);
r = await call("GET", "/api/users/loggedin");
ok("loggedin → false without cookie", r.json === false);
r = await call("GET", "/api/users/getuser", { cookie });
ok("getuser returns profile without password", r.status === 200 && !("password" in r.json) && r.json.email === "asha@test.dev");
r = await call("GET", "/api/users/getuser");
ok("getuser without session → 401", r.status === 401);

r = await call("PATCH", "/api/users/updateuser", { cookie, body: { name: "Asha Rao", phone: "+91 98765", bio: "Warehouse lead" } });
ok("updateuser (JSON) works", r.status === 200 && r.json.bio === "Warehouse lead", r.json?.message);

// ---- 3. Products ----
const fd = new FormData();
for (const [k, v] of Object.entries({ name: "Wireless Keyboard", category: "Electronics", quantity: "42", price: "1499", description: "Slim, quiet keys." })) fd.append(k, v);
r = await call("POST", "/api/products", { cookie, form: fd });
ok("create product (multipart, no image) → 201", r.status === 201, r.json?.message);
const pid = r.json._id;
ok("sku auto-generated from category", /^ELE-\d+$/.test(r.json.sku), r.json.sku);
ok("quantity/price stored as numbers", typeof r.json.quantity === "number" && r.json.price === 1499);
ok("totalValue computed in JSON", r.json.totalValue === 62958);

const fd2 = new FormData();
for (const [k, v] of Object.entries({ name: "Bad", category: "X", quantity: "-3", price: "10", description: "neg" })) fd2.append(k, v);
r = await call("POST", "/api/products", { cookie, form: fd2 });
ok("negative quantity rejected", r.status === 400, r.json?.message);

const fd3 = new FormData();
for (const [k, v] of Object.entries({ name: "Missing price", category: "X", quantity: "1", description: "d" })) fd3.append(k, v);
r = await call("POST", "/api/products", { cookie, form: fd3 });
ok("missing field rejected", r.status === 400, r.json?.message);

const fdImg = new FormData();
for (const [k, v] of Object.entries({ name: "Img test", category: "Misc", quantity: "1", price: "1", description: "d" })) fdImg.append(k, v);
fdImg.append("image", new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" }), "a.png");
r = await call("POST", "/api/products", { cookie, form: fdImg });
ok("image upload fails cleanly (no Cloudinary access here) → 502", r.status === 502, r.json?.message);

const badType = new FormData();
for (const [k, v] of Object.entries({ name: "x", category: "x", quantity: "1", price: "1", description: "d" })) badType.append(k, v);
badType.append("image", new Blob(["hello"], { type: "text/plain" }), "a.txt");
r = await call("POST", "/api/products", { cookie, form: badType });
ok("non-image upload rejected with 400", r.status === 400, r.json?.message);

r = await call("GET", "/api/products", { cookie });
ok("list products returns owner's items", r.status === 200 && r.json.length === 1);

r = await call("GET", `/api/products/${pid}`, { cookie });
ok("get product by id", r.status === 200 && r.json.name === "Wireless Keyboard");

r = await call("GET", "/api/products/not-an-id", { cookie });
ok("malformed id → 400 (not 500)", r.status === 400, r.json?.message);

const upd = new FormData();
upd.append("quantity", "0");
upd.append("price", "1299");
r = await call("PATCH", `/api/products/${pid}`, { cookie, form: upd });
ok("partial update (multipart) keeps other fields", r.status === 200 && r.json.quantity === 0 && r.json.name === "Wireless Keyboard");

// ---- 4. Ownership isolation ----
r = await call("POST", "/api/users/register", { body: { name: "Ben", email: "ben@test.dev", password: strong } });
const benMail = await mailFor("ben@test.dev", /confirm-email\/([a-f0-9]{64})/);
await call("PUT", `/api/users/confirmEmail/${benMail.token}`);
const benLogin = await call("POST", "/api/users/login", { body: { email: "ben@test.dev", password: strong } });
const benCookie = benLogin.cookie;
r = await call("GET", `/api/products/${pid}`, { cookie: benCookie });
ok("another user cannot read the product → 404", r.status === 404);
r = await call("DELETE", `/api/products/${pid}`, { cookie: benCookie });
ok("another user cannot delete the product → 404", r.status === 404);
r = await call("GET", "/api/products", { cookie: benCookie });
ok("another user's list is empty", Array.isArray(r.json) && r.json.length === 0);

// ---- 5. Contact form ----
const before = mailCount();
r = await call("POST", "/api/contactus", { cookie, body: { subject: "Bug: <script>", message: "Line one\nLine two" } });
ok("contact form sends → 200", r.status === 200, r.json?.message);
const contactMail = await mailFor("asha@test.dev", /Line one/, { after: before, tries: 4 });
// the contact mail is delivered to the configured inbox (EMAIL_USER/SMTP_USER), not to asha
const inbox = JSON.parse(fs.readFileSync(INBOX, "utf8")).slice(before);
const cm = inbox.find((m) => m.text.includes("Line one"));
ok("contact mail delivered with reply-to = sender", cm && cm.reply_to === "asha@test.dev", cm?.reply_to);

// ---- 6. Password reset ----
r = await call("POST", "/api/users/forgotpassword", { body: { email: "nobody@test.dev" } });
ok("forgot password for unknown email → generic 200", r.status === 200 && /reset link/.test(r.json.message));
const beforeReset = mailCount();
r = await call("POST", "/api/users/forgotpassword", { body: { email: "asha@test.dev" } });
ok("forgot password for real email → 200", r.status === 200);
const resetMail = await mailFor("asha@test.dev", /reset-password\/([a-f0-9]{64})/, { after: beforeReset });
ok("reset email delivered", !!resetMail);

r = await call("PUT", `/api/users/resetpassword/${resetMail.token}`, { body: { password: "N3w!Passwd", confirmPassword: "Mismatch1!" } });
ok("reset with mismatched passwords → 400", r.status === 400);
r = await call("PUT", `/api/users/resetpassword/${resetMail.token}`, { body: { password: "N3w!Passwd", confirmPassword: "N3w!Passwd" } });
ok("reset password → 200", r.status === 200, r.json?.message);
r = await call("PUT", `/api/users/resetpassword/${resetMail.token}`, { body: { password: "N3w!Passwd", confirmPassword: "N3w!Passwd" } });
ok("reset token is single-use", r.status === 404);
r = await call("POST", "/api/users/login", { body: { email: "asha@test.dev", password: strong } });
ok("old password no longer works", r.status === 401);
r = await call("POST", "/api/users/login", { body: { email: "asha@test.dev", password: "N3w!Passwd" } });
ok("new password works", r.status === 200);
const newCookie = r.cookie;

// ---- 7. Change password ----
r = await call("PATCH", "/api/users/changepassword", { cookie: newCookie, body: { oldPassword: "nope", password: "Ch4nged!Pw", confirmPassword: "Ch4nged!Pw" } });
ok("change password with wrong old password → 400", r.status === 400, r.json?.message);
r = await call("PATCH", "/api/users/changepassword", { cookie: newCookie, body: { oldPassword: "N3w!Passwd", password: "Ch4nged!Pw", confirmPassword: "Ch4nged!Pw" } });
ok("change password → 200", r.status === 200, r.json?.message);

// ---- 8. Logout + robustness ----
r = await call("GET", "/api/users/logout", { cookie: newCookie });
ok("logout → 200", r.status === 200);
r = await call("POST", "/api/users/login", { raw: "{bad json", });
ok("malformed JSON → 400", r.status === 400, r.json?.message);
r = await call("POST", "/api/users/login");
ok("login with no body → 400 (no crash)", r.status === 400, r.json?.message);
r = await call("PATCH", "/api/users/updateuser");
ok("PATCH with no session and no body → 401 (no crash)", r.status === 401);
r = await call("GET", "/api/nope");
ok("unknown route → 404 JSON", r.status === 404 && r.json.message);
r = await call("GET", "/api/health");
ok("health endpoint", r.status === 200 && r.json.status === "ok");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
