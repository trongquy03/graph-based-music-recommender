import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();


const pythonPath = `"${process.env.PYTHON_SPLITTER_PATH}"`;
const ffmpegPath = `ffmpeg`; 

// Hàm tách giọng và chuyển sang .mp3
export const splitAudioWithSpleeter = (inputPath, outputDir) => {
   return new Promise((resolve, reject) => {
    // escape backslashes
    const inputSafe = inputPath.replace(/\\/g, '/');
    const outputSafe = outputDir.replace(/\\/g, '/');
    
    const command = `${pythonPath} -m spleeter separate "${inputSafe}" -p spleeter:2stems -o "${outputSafe}"`;

    console.log("Spleeter CMD:", command);
    console.log("Check file exists:", fs.existsSync(inputPath));

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("Lỗi khi chạy spleeter:", stderr);
        return reject(error);
      }
      const baseName = path.basename(inputPath, path.extname(inputPath));
      const resultDir = path.join(outputDir, baseName);
      const accompanimentWav = path.join(resultDir, 'accompaniment.wav');
      const accompanimentMp3 = path.join(resultDir, 'accompaniment.mp3');

      // Convert WAV → MP3 cho nhẹ hơn
      const convertCmd = `${ffmpegPath} -y -i "${accompanimentWav}" -codec:a libmp3lame -qscale:a 2 "${accompanimentMp3}"`;

      exec(convertCmd, (err, out, errOut) => {
        if (err) {
          console.error('Lỗi khi convert MP3:', errOut);
          return reject(err);
        }

        resolve({
          mp3Path: accompanimentMp3,
          wavPath: accompanimentWav,
          vocalPath: path.join(resultDir, 'vocals.wav'),
        });
      });
    });
  });
};
