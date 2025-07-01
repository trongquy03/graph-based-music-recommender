import os
import subprocess
import uuid
import cloudinary
import cloudinary.uploader
from flask import Flask, request, jsonify
from faster_whisper import WhisperModel
from yt_dlp import YoutubeDL
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)

# Cấu hình Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

@app.route('/api/process-youtube', methods=['POST'])
def process_youtube():
    url = request.json.get("url")
    if not url:
        return jsonify({"error": "No URL provided"}), 400

    # Lấy metadata và tải file
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': '%(id)s.%(ext)s',
    }

    with YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        video_id = info.get("id")
        title = info.get("title")
        uploader = info.get("uploader")
        thumbnail = info.get("thumbnail")
        embed_url = f"https://www.youtube.com/embed/{video_id}"
        filename = f"{video_id}.webm"

    # Convert sang mp3
    mp3_file = f"{video_id}_{uuid.uuid4().hex}.mp3"
    subprocess.run(["ffmpeg", "-i", filename, "-vn", "-ar", "44100", "-ac", "2", "-b:a", "192k", mp3_file],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # Upload lên Cloudinary
    upload_result = cloudinary.uploader.upload(mp3_file, resource_type="video")
    audio_url = upload_result.get("secure_url")

    # Chạy Whisper (word-level)
    model = WhisperModel("tiny", device="cpu", compute_type="int8")
    segments, _ = model.transcribe(mp3_file, word_timestamps=True, beam_size=5)

    transcript_words = []
    for segment in segments:
        for word in segment.words:
            transcript_words.append({
                "word": word.word.strip(),
                "start": round(word.start, 2),
                "end": round(word.end, 2)
            })

    # Xoá file tạm
    os.remove(filename)
    os.remove(mp3_file)

    return jsonify({
        "video_id": video_id,
        "title": title,
        "uploader": uploader,
        "thumbnail": thumbnail,
        "embed_url": embed_url,
        "audio_url": audio_url,
        "transcript": transcript_words  # JSON từng chữ
    })

if __name__ == '__main__':
    app.run(port=4000)
