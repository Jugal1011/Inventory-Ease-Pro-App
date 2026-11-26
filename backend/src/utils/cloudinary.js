import { v2 as cloudinary } from "cloudinary";
import { AppError } from "./AppError.js";

// Reads CLOUDINARY_URL automatically when present.
cloudinary.config({ secure: true });

export function uploadImage(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: "image" }, (error, result) => {
      if (error) {
        console.error("[cloudinary] upload failed:", error.message);
        return reject(new AppError("Image could not be uploaded, please try again", 502));
      }
      resolve(result);
    });
    stream.end(buffer);
  });
}

export async function deleteImage(publicId) {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId, { invalidate: true });
}
