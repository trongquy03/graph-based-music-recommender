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

    const folder = parts.slice(-2, -1)[0]; // lấy tên folder nếu có
    const fullPublicId = folder ? `${folder}/${publicId}` : publicId;

    await cloudinary.uploader.destroy(fullPublicId, {
      resource_type: "auto",
    });

    console.log(` Cloudinary file deleted: ${fullPublicId}`);
  } catch (error) {
    console.error(" Error deleting Cloudinary file:", error);
  }
};



export default cloudinary