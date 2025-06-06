import { useEffect, useRef, useState } from "react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { usePremiumStore } from "@/stores/usePremiumStore";
import { axiosInstance } from "@/lib/axios";

const AudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const prevSongRef = useRef<string | null>(null);
  const [isAdMode, setIsAdMode] = useState(false);
  const [remaining, setRemaining] = useState(10);
  const [skipEnabled, setSkipEnabled] = useState(false);

  const {
    currentSong,
    isPlaying,
    playNext,
    isLooping,
    setIsPlayingAd,
    setIsPlaying,
  } = usePlayerStore();

  const { isPremium } = usePremiumStore();

  const recordListening = async (songId: string) => {
    try {
      await axiosInstance.post("/history", { songId });
    } catch (error) {
      console.error("Failed to record listening", error);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying && audio.src) {
      audio.play().catch((err) => {
        console.warn("Play error:", err.message);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      if (isLooping && currentSong && !isAdMode) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return;
      }

      if (!isPremium && !isAdMode) {
        setIsPlayingAd(true);
        setIsAdMode(true);
        setSkipEnabled(false);
        setRemaining(10);

        const countdown = setInterval(() => {
          setRemaining((prev) => {
            if (prev <= 1) {
              clearInterval(countdown);
              setSkipEnabled(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        audio.src = "/songs/ads.mp3";
        audio.load();
        audio.play().catch(() => {});
        return;
      }

      if (isAdMode) {
        setIsAdMode(false);
        setIsPlayingAd(false);
        setSkipEnabled(false);
        playNext();
        return;
      }

      playNext();
    };

    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("ended", handleEnded);
    };
  }, [currentSong, isLooping, isPremium, isAdMode]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong?.audioUrl || isAdMode) return;

    const isNewSong = prevSongRef.current !== currentSong.audioUrl;
    if (!isNewSong) return;

    prevSongRef.current = currentSong.audioUrl;
    audio.pause();
    audio.src = currentSong.audioUrl;
    audio.load();
    audio.currentTime = 0;

    recordListening(currentSong._id);

    if (isPlaying) {
      audio.play().catch((err) => {
        console.warn("Failed to auto-play after source change:", err.message);
      });
    }
  }, [currentSong?.audioUrl, isAdMode]);


  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong || isPremium || !currentSong.isPremium) return;

    const timer = setInterval(() => {
      if (audio.currentTime >= 30) {
        audio.pause();
        audio.currentTime = 0;
        setIsPlaying(false); 
        
      }
    }, 500);

    return () => clearInterval(timer);
  }, [currentSong, isPremium]);

  const skipAd = () => {
    if (!skipEnabled) return;
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    setIsAdMode(false);
    setIsPlayingAd(false);
    setSkipEnabled(false);
    playNext();
  };

  return (
    <>
      {isAdMode && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.6)] backdrop-blur-md z-[9999] flex items-center justify-center">
          <div className="relative bg-white rounded-lg overflow-hidden w-[90%] max-w-4xl">
            <img src="/bannerAds.png" alt="Ad Banner" className="w-full h-auto" />
            <div className="absolute bottom-5 left-0 right-0 px-6 flex justify-between items-center">
              <button
                onClick={() => window.open("/premium", "_blank")}
                className="bg-green-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-green-700"
              >
                NÂNG CẤP NGAY
              </button>
              <button
                onClick={skipAd}
                disabled={!skipEnabled}
                className={`px-5 py-2 rounded-lg text-white font-semibold transition ${
                  skipEnabled
                    ? "bg-gray-800 hover:bg-gray-900"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                {skipEnabled ? "Bỏ qua quảng cáo" : `Chờ ${remaining}s...`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thông báo cố định nếu chưa Premium */}
      {currentSong?.isPremium && !isPremium && (
        <div className="w-full bg-yellow-500 text-white text-center text-sm py-2 font-semibold fixed bottom-20 z-[9998]">
          Nâng cấp tài khoản Premium để nghe trọn bài hát.{" "}
          <a
            href="/premium"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white"
          >
            Tìm hiểu ngay
          </a>
        </div>
      )}

      <audio ref={audioRef} />
    </>
  );
};

export default AudioPlayer;
