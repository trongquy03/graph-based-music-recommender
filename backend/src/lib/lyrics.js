// src/lib/lyrics.js
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { uploadRawToCloudinary } from "./cloudinary.js";

const tempDir = path.join(process.cwd(), "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export const generateLyricsFromCloudinaryUrl = async (audioUrl) => {
  try {
    console.log("⬇️ Downloading audio from:", audioUrl);

    // 1. Download audio to temp file
    const res = await axios.get(audioUrl, {
      responseType: "arraybuffer",
    });

    const buffer = Buffer.from(res.data);
    const tempFilename = `temp-${uuidv4()}.mp3`;
    const tempPath = path.join("./temp", tempFilename);
    fs.writeFileSync(tempPath, buffer);

    // 2. Prepare FormData
    const formData = new FormData();
    formData.append("file", fs.createReadStream(tempPath));
    formData.append("model", "whisper-1");
    formData.append("response_format", "srt");

    console.log("🚀 Transcribing via OpenAI Whisper...");
    const whisperRes = await axios.post(
      "https://api.openai.com/v1/audio/transcriptions",
      formData,
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          ...formData.getHeaders(),
        },
        maxBodyLength: Infinity,
      }
    );

    const srtText = whisperRes.data;

    // 3. Save .srt locally (optional)
    const srtPath = tempPath.replace(".mp3", ".srt");
    fs.writeFileSync(srtPath, srtText);

    // 4. Upload .srt to Cloudinary (raw resource type)
    const cloudinaryUrl = await uploadRawToCloudinary(srtPath);

    // 5. Cleanup temp files
    fs.unlinkSync(tempPath);
    fs.unlinkSync(srtPath);

    return cloudinaryUrl;
  } catch (err) {
    console.error("Error generating lyrics:", err.response?.data || err);
    throw new Error("Failed to generate lyrics");
  }
};