import axios from "axios";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const tempDir = path.join(process.cwd(), "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

/**
 * Tải file về temp folder, trả về path
 * @param {string} fileUrl - URL file .mp3
 * @returns {string} local temp path
 */
export const downloadFileToTemp = async (fileUrl) => {
  const res = await axios.get(fileUrl, { responseType: "arraybuffer" });
  const buffer = Buffer.from(res.data);

  const tempFilename = `temp-${uuidv4()}.mp3`;
  const tempPath = path.join(tempDir, tempFilename);
  fs.writeFileSync(tempPath, buffer);

  return tempPath;
};
