import multer from "multer";
import mongoose from "mongoose";
import { AppError } from "../utils/AppError.js";

export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// One error shape for the whole API: { message }.
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  let status = err.statusCode || err.status || 500;
  let message = err.message || "Server error";

  if (err instanceof AppError) {
    status = err.statusCode;
  } else if (err instanceof multer.MulterError) {
    status = 400;
    message = err.code === "LIMIT_FILE_SIZE" ? "Image must be 5MB or smaller" : err.message;
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = Object.values(err.errors)[0]?.message || "Validation failed";
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid ${err.path}`;
  } else if (err.code === 11000) {
    status = 409;
    message = "A record with this value already exists";
  } else if (err.type === "entity.parse.failed") {
    status = 400;
    message = "Malformed JSON body";
  }

  // Expected application errors are not logged; only unexpected failures are.
  if (status >= 500 && !(err instanceof AppError)) console.error(err);

  res.status(status).json({
    message,
    ...(process.env.NODE_ENV !== "production" && status >= 500 ? { stack: err.stack } : {}),
  });
}
