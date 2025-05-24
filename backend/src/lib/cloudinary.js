import {v2 as cloudinary} from "cloudinary"

import dotenv from "dotenv"
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const deleteFromCloudinary = async (fileUrl) => {
  try {
    if (!fileUrl) return;

    const parts = fileUrl.split('/');
    const filenameWithExt = parts[parts.length - 1];
    const publicId = filenameWithExt.split('.')[0];
    const folder = parts.slice(-2, -1)[0];
    const fullPublicId = folder ? `${folder}/${publicId}` : publicId;

    // Xác định resource_type từ đuôi file
    const extension = filenameWithExt.split('.').pop();
    let resourceType = "raw"; // fallback mặc định

    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) {
      resourceType = "image";
    } else if (["mp3", "mp4", "wav", "ogg", "m4a"].includes(extension)) {
      resourceType = "video";
    }

    await cloudinary.uploader.destroy(fullPublicId, {
      resource_type: resourceType,
    });

    console.log(`Cloudinary file deleted: ${fullPublicId} (${resourceType})`);
  } catch (error) {
    console.error("Error deleting Cloudinary file:", error);
  }
};


export default cloudinary