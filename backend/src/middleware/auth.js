import User from "../models/User.js";
import { verifySessionToken } from "../utils/tokens.js";
import { AppError } from "../utils/AppError.js";

export async function protect(req, res, next) {
  const token = req.cookies?.token;
  if (!token) throw new AppError("Not authorized, please login", 401);

  let payload;
  try {
    payload = verifySessionToken(token);
  } catch {
    throw new AppError("Session expired, please login again", 401);
  }

  const user = await User.findById(payload.id);
  if (!user) throw new AppError("User not found, please signup", 401);

  req.user = user;
  next();
}
