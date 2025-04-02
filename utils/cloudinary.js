// utils/cloudinary.js

import cloudinary from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
});

// Function to upload a file to Cloudinary
export const uploadToCloudinary = (fileBuffer, folder, publicId) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        public_id: publicId,
        use_filename: true,
        unique_filename: false,
      },
      (error, result) => {
        if (error) reject(error);
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

// Function to delete a file from Cloudinary
export const deleteFromCloudinary = (publicId) => {
  return new Promise((resolve, reject) => {
    cloudinary.v2.uploader.destroy(publicId, (error, result) => {
      if (error) reject(error);
      resolve(result);
    });
  });
};
