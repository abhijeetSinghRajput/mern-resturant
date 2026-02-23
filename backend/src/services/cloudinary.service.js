import streamifier from "streamifier";
import cloudinary from "../config/cloudinary.config.js";

export const uploadStream = (buffer, folder = "default_folder") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        use_filename: false,
        unique_filename: true,

        // ✅ Recommended optimization
        transformation: [
          { quality: "auto:good" },   // smart compression
          { fetch_format: "auto" },   // serves AVIF/WebP automatically
        ],
      },
      (error, result) => {
        if (error) return reject(error);

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};