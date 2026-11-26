import User from "../models/User.js";
import Token from "../models/Token.js";
import { AppError } from "../utils/AppError.js";
import { signSessionToken, createOneTimeToken, consumeOneTimeToken, verifySessionToken } from "../utils/tokens.js";
import { sendEmail, emailTemplate } from "../utils/mailer.js";
import { uploadImage } from "../utils/cloudinary.js";
import { isValidEmail, isStrongPassword, PASSWORD_RULE_MESSAGE } from "../utils/validators.js";

const isProd = () => process.env.NODE_ENV === "production";
const frontend = () => process.env.FRONTEND_URL || "http://localhost:5173";

// Cross-site cookies need SameSite=None + Secure in production. Dev uses the Vite proxy (same-site).
const cookieOptions = () => ({
  path: "/",
  httpOnly: true,
  sameSite: isProd() ? "none" : "lax",
  secure: isProd(),
});

async function sendVerificationEmail(user) {
  const token = await createOneTimeToken(user._id, "confirm-email", 30);
  const url = `${frontend()}/app/confirm-email/${token}`;
  await sendEmail({
    to: user.email,
    subject: "Confirm your email",
    html: emailTemplate({
      heading: `Welcome, ${user.name}!`,
      body: "Thanks for joining InventoryEasePro. Confirm your email to start managing your inventory. This link expires in 30 minutes.",
      ctaUrl: url,
      ctaLabel: "Confirm email",
    }),
  });
}

export async function register(req, res) {
  const { name, email, password } = req.body ?? {};

  if (!name || !email || !password) throw new AppError("Please fill in all required fields", 400);
  if (!isValidEmail(email)) throw new AppError("Please enter a valid email", 400);
  if (!isStrongPassword(password)) throw new AppError(PASSWORD_RULE_MESSAGE, 400);

  const exists = await User.exists({ email: email.toLowerCase().trim() });
  if (exists) throw new AppError("Email has already been registered", 409);

  const user = await User.create({ name, email, password });

  try {
    await sendVerificationEmail(user);
  } catch (err) {
    console.error("Verification email failed:", err.message);
    // Roll back so the person can retry with a working address.
    await User.deleteOne({ _id: user._id });
    throw new AppError("Verification email could not be sent. Please check the address and try again.", 502);
  }

  res.status(201).json({ ...user.toPublic(), message: "Verification email sent" });
}

export async function login(req, res) {
  const { email, password } = req.body ?? {};
  if (!email || !password) throw new AppError("Please add email and password", 400);

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
  const ok = user && (await user.comparePassword(password));
  if (!ok) throw new AppError("Invalid email or password", 401);

  if (!user.verified) {
    try {
      await sendVerificationEmail(user);
    } catch {
      throw new AppError("Verification email could not be sent. Please try again later.", 502);
    }
    throw new AppError("Email not verified. We sent you a new verification link.", 403);
  }

  res.cookie("token", signSessionToken(user._id), { ...cookieOptions(), maxAge: 24 * 60 * 60 * 1000 });
  res.json(user.toPublic());
}

export async function logout(req, res) {
  res.clearCookie("token", cookieOptions());
  res.json({ message: "Successfully logged out" });
}

export async function getMe(req, res) {
  res.json(req.user.toPublic());
}

export async function loginStatus(req, res) {
  const token = req.cookies?.token;
  if (!token) return res.json(false);
  try {
    verifySessionToken(token);
    res.json(true);
  } catch {
    res.json(false);
  }
}

export async function updateUser(req, res) {
  const user = req.user;
  const { name, phone, bio } = req.body ?? {};

  if (name !== undefined && String(name).trim()) user.name = String(name).trim();
  if (phone !== undefined && String(phone).trim()) user.phone = String(phone).trim();
  if (bio !== undefined) user.bio = String(bio);

  if (req.file) {
    const uploaded = await uploadImage(req.file.buffer, "Inventory App/avatars");
    user.photo = uploaded.secure_url;
  }

  await user.save();
  res.json(user.toPublic());
}

export async function changePassword(req, res) {
  const { oldPassword, password, confirmPassword } = req.body ?? {};
  if (!oldPassword || !password || !confirmPassword) throw new AppError("Please add old and new password", 400);
  if (password !== confirmPassword) throw new AppError("New password and confirm password don't match", 400);
  if (!isStrongPassword(password)) throw new AppError(PASSWORD_RULE_MESSAGE, 400);

  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.comparePassword(oldPassword))) throw new AppError("Old password is incorrect", 400);

  user.password = password;
  await user.save();
  res.json({ message: "Password changed successfully" });
}

export async function forgotPassword(req, res) {
  const { email } = req.body ?? {};
  if (!isValidEmail(email)) throw new AppError("Please enter a valid email", 400);

  // Same response whether or not the account exists, so emails can't be probed.
  const generic = { message: "If an account exists for this email, a reset link has been sent." };

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) return res.json(generic);

  const token = await createOneTimeToken(user._id, "forget-password", 30);
  const url = `${frontend()}/app/reset-password/${token}`;
  try {
    await sendEmail({
      to: user.email,
      subject: "Password reset request",
      html: emailTemplate({
        heading: "Reset your password",
        body: "Use the button below to choose a new password. The link is valid for 30 minutes. If you didn't request this, you can ignore this email.",
        ctaUrl: url,
        ctaLabel: "Reset password",
      }),
    });
  } catch {
    throw new AppError("Email not sent, please try again", 502);
  }
  res.json(generic);
}

export async function resetPassword(req, res) {
  const { password, confirmPassword } = req.body ?? {};
  const { resetToken } = req.params;

  if (!password || password !== confirmPassword) throw new AppError("New password and confirm password don't match", 400);
  if (!isStrongPassword(password)) throw new AppError(PASSWORD_RULE_MESSAGE, 400);

  const tokenDoc = await consumeOneTimeToken(resetToken, "forget-password");
  if (!tokenDoc) throw new AppError("Invalid or expired link", 404);

  const user = await User.findById(tokenDoc.userId);
  if (!user) throw new AppError("Invalid or expired link", 404);

  user.password = password;
  await user.save();
  await Token.deleteMany({ userId: user._id, tokenType: "forget-password" });

  res.json({ message: "Password reset successful, please login" });
}

export async function confirmEmail(req, res) {
  const { confirmEmailToken } = req.params;
  const tokenDoc = await consumeOneTimeToken(confirmEmailToken, "confirm-email");
  if (!tokenDoc) throw new AppError("Invalid or expired link", 404);

  const user = await User.findById(tokenDoc.userId);
  if (!user) throw new AppError("Invalid or expired link", 404);

  await Token.deleteMany({ userId: user._id, tokenType: "confirm-email" });

  if (user.verified) return res.json({ message: "Email already verified" });

  user.verified = true;
  await user.save();
  res.json({ message: "Email verified successfully" });
}
