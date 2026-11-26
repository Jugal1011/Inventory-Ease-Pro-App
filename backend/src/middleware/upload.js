import multer from "multer";
import { AppError } from "../utils/AppError.js";

const ALLOWED = new Set(["image/png", "image/jpg", "image/jpeg", "image/webp"]);

// Files stay in memory and go straight to Cloudinary; nothing is written to disk.
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (ALLOWED.has(file.mimetype)) return cb(null, true);
    cb(new AppError("Only jpg, jpeg, png or webp images are allowed", 400));
  },
});
