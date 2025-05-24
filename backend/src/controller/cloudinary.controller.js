import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

export const getUploadSignature = (req, res) => {
  const timestamp = Math.floor(Date.now() / 1000);

  const paramsToSign = {
    timestamp,
    folder: "songs",
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET
  );


  res.json({
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    folder: paramsToSign.folder,
  });
};
