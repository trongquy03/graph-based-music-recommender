import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { axiosInstance } from "@/lib/axios";

const AudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const prevSongRef = useRef<string | null>(null);

  const { currentSong, isPlaying, playNext, isLooping } = usePlayerStore();

  const recordListening = async (songId: string) => {
    try {
      await axiosInstance.post("/history", { songId });
    } catch (error) {
      console.error("❌ Failed to record listening", error);
    }
  };

  // Phát hoặc tạm dừng nhạc theo trạng thái `isPlaying`
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying && audio.src) {
      audio.play().catch((err) => {
        console.warn("⚠️ Play error:", err.message);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // Xử lý khi bài hát kết thúc
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      if (isLooping && currentSong) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        playNext();
      }
    };

    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("ended", handleEnded);
    };
  }, [currentSong, isLooping, playNext]);

  // Khi currentSong thay đổi: load source mới & play nếu cần
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong?.audioUrl) return;

    const isNewSong = prevSongRef.current !== currentSong.audioUrl;
    if (!isNewSong) return;

    // Load bài hát mới
    prevSongRef.current = currentSong.audioUrl;
    audio.pause(); // Dừng bài trước
    audio.src = currentSong.audioUrl;
    audio.load(); // Bắt buộc gọi load()
    audio.currentTime = 0;

    recordListening(currentSong._id);

    // Play nếu đang ở trạng thái `isPlaying`
    if (isPlaying) {
      audio.play().catch((err) => {
        console.warn("⚠️ Failed to auto-play after source change:", err.message);
      });
    }
  }, [currentSong?.audioUrl]);

  return <audio ref={audioRef} />;
};

export default AudioPlayer;
