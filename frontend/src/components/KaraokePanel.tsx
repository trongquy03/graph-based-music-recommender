import { useEffect, useRef, useState } from "react";
import { axiosInstance } from "@/lib/axios";

interface LyricLine {
  start: number;
  end: number;
  text: string;
}

interface Props {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  lyricsUrl?: string;
  currentSong: { _id: string; karaokeUrl?: string; audioUrl: string };
}

const parseSRT = (srt: string): LyricLine[] => {
  const blocks = srt
    .replace(/\r/g, "")
    .replace(/\uFEFF/g, "")
    .trim()
    .split(/\n{2,}/);

  const result: LyricLine[] = [];

  const toSec = (t: string) => {
    const [h, m, s] = t.split(":");
    const [sec, ms] = s.split(",");
    return (
      parseInt(h || "0") * 3600 +
      parseInt(m || "0") * 60 +
      parseInt(sec || "0") +
      parseInt(ms || "0") / 1000
    );
  };

  for (const block of blocks) {
    const lines = block.trim().split("\n");
    const timeLine = lines.find((line) => line.includes("-->"));
    const textLines = lines.filter(
      (line) => !/^\d+$/.test(line) && !line.includes("-->")
    );

    if (!timeLine) continue;

    const [startStr, endStr] = timeLine.split(" --> ");
    if (!startStr || !endStr) continue;

    const start = toSec(startStr.trim());
    const end = toSec(endStr.trim());

    if (isNaN(start) || isNaN(end)) continue;

    result.push({
      start,
      end,
      text: textLines.join("\n").trim(),
    });
  }

  return result;
};

const KaraokePanel = ({ audioRef, lyricsUrl, currentSong }: Props) => {
  const [activeTab, setActiveTab] = useState<'playlist' | 'karaoke' | 'lyrics'>('lyrics');
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingKaraoke, setIsLoadingKaraoke] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!lyricsUrl) return;
    const fetchLyrics = async () => {
      try {
        const res = await fetch(lyricsUrl);
        const text = await res.text();
        setLyrics(parseSRT(text));
      } catch (err) {
        console.error("Failed to load lyrics", err);
      }
    };
    fetchLyrics();
  }, [lyricsUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, [audioRef]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      if (!audioRef.current || lyrics.length === 0) return;
      const currentTime = audioRef.current.currentTime;
      const index = lyrics.findIndex(
        (line) => currentTime >= line.start && currentTime < line.end
      );
      if (index !== -1 && index !== currentIndex) {
        setCurrentIndex(index);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying, audioRef, lyrics, currentIndex]);

  useEffect(() => {
    if (containerRef.current) {
      const activeLine = containerRef.current.querySelector(".active-line");
      if (activeLine && activeLine.scrollIntoView) {
        activeLine.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [currentIndex]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-center space-x-4 mt-2 text-sm md:text-base">
        <button
          className={`px-4 py-1 rounded-full ${activeTab === "playlist" ? "bg-white text-black" : "text-white/60"}`}
          onClick={() => setActiveTab("playlist")}
        >
          Danh sách phát
        </button>
        <button
          disabled={isLoadingKaraoke}
          className={`px-4 py-1 rounded-full transition-opacity duration-200 ${
            isLoadingKaraoke ? "opacity-50 cursor-not-allowed" : ""
          } ${activeTab === "karaoke" ? "bg-white text-black" : "text-white/60"}`}
          onClick={async () => {
            if (!currentSong.karaokeUrl) {
              setIsLoadingKaraoke(true);
              try {
                const { data } = await axiosInstance.post(`/songs/${currentSong._id}/karaoke`);
                if (data.karaokeUrl) {
                  currentSong.karaokeUrl = data.karaokeUrl;
                } else {
                  alert("Tạo karaoke thất bại");
                  setIsLoadingKaraoke(false);
                  return;
                }
              } catch (err) {
                console.error(err);
                alert("Lỗi khi gọi API tạo karaoke");
                setIsLoadingKaraoke(false);
                return;
              }
              setIsLoadingKaraoke(false);
            }

            if (audioRef.current && currentSong.karaokeUrl) {
              audioRef.current.src = currentSong.karaokeUrl;
              audioRef.current.play();
            }

            setActiveTab("karaoke");
          }}
        >
          Karaoke
        </button>
        <button
          className={`px-4 py-1 rounded-full ${activeTab === "lyrics" ? "bg-white text-black" : "text-white/60"}`}
          onClick={() => {
            if (audioRef.current) {
              audioRef.current.src = currentSong.audioUrl;
              audioRef.current.play();
            }
            setActiveTab("lyrics");
          }}
        >
          Lời bài hát
        </button>
      </div>

      <div className="flex-grow mt-4 overflow-hidden">
        {activeTab === "karaoke" && (
          <div className="w-full h-full bg-gradient-to-br from-[#2b1f47] to-[#130c1c] flex flex-col items-center justify-center text-white text-center px-4">
            {isLoadingKaraoke ? (
              <div className="flex items-center justify-center h-full animate-spin text-4xl">⏳</div>
            ) : (
              <>
                <h1 className="text-3xl md:text-5xl font-bold transition-all duration-300 text-yellow-400 drop-shadow-[0_0_6px_rgba(255,255,0,0.5)]">
                  {lyrics[currentIndex]?.text || ""}
                </h1>
                <p className="mt-4 text-xl md:text-2xl opacity-30">
                  {lyrics[currentIndex + 1]?.text || ""}
                </p>
              </>
            )}
          </div>
        )}

        {activeTab === "lyrics" && (
          <div
            ref={containerRef}
            className="h-full text-center px-4 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent"
          >
            {lyrics.map((line, i) => (
              <p
                key={i}
                onClick={() => {
                  if (audioRef.current) {
                    audioRef.current.currentTime = line.start;
                    if (!audioRef.current.paused) audioRef.current.play();
                  }
                }}
                className={`transition-all duration-200 my-3 text-xl md:text-2xl font-semibold whitespace-pre-wrap tracking-wide leading-relaxed cursor-pointer ${
                  i === currentIndex
                    ? "text-emerald-400 font-extrabold active-line scale-110 drop-shadow-[0_0_4px_#34d399]"
                    : "text-zinc-500 opacity-60 hover:text-white/80"
                }`}
              >
                {line.text}
              </p>
            ))}
          </div>
        )}

        {activeTab === "playlist" && (
          <div className="text-center text-white/70 py-6">
            🎶 Danh sách phát sẽ hiển thị tại đây (bạn có thể tuý chỉnh sau)
          </div>
        )}
      </div>
    </div>
  );
};

export default KaraokePanel;
