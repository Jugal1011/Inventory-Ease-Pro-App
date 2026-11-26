import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import Token from "../models/Token.js";

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

export const signSessionToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "1d" });

export const verifySessionToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

/**
 * Creates a single-use, time-limited token. Only the SHA-256 hash is stored;
 * the raw value is returned once and sent to the user by email.
 */
export async function createOneTimeToken(userId, tokenType, minutes = 30) {
  await Token.deleteMany({ userId, tokenType });
  const raw = crypto.randomBytes(32).toString("hex");
  await Token.create({
    userId,
    token: sha256(raw),
    tokenType,
    expiresAt: new Date(Date.now() + minutes * 60_000),
  });
  return raw;
}

export async function consumeOneTimeToken(raw, tokenType) {
  return Token.findOne({
    token: sha256(raw),
    tokenType,
    expiresAt: { $gt: new Date() },
  });
}
