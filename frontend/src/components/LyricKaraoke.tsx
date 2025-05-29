import { useEffect, useRef, useState } from "react";

interface LyricLine {
  start: number;
  end: number;
  text: string;
}

interface Props {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  lyricsUrl?: string;
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
    const timeLine = lines.find(line => line.includes("-->"));
    const textLines = lines.filter(line => !/^\d+$/.test(line) && !line.includes("-->"));

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

const LyricKaraoke = ({ audioRef, lyricsUrl }: Props) => {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!lyricsUrl) return;

    const fetchLyrics = async () => {
      try {
        const res = await fetch(lyricsUrl);
        const text = await res.text();
        const parsed = parseSRT(text);
        setLyrics(parsed);
      } catch (err) {
        console.error("Failed to load lyrics", err);
      }
    };

    fetchLyrics();
  }, [lyricsUrl]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!audioRef.current || lyrics.length === 0) return;
      const currentTime = audioRef.current.currentTime;

      const index = lyrics.findIndex(
        (line) => currentTime >= line.start && currentTime < line.end
      );

      if (index !== -1 && index !== currentIndex) {
        setCurrentIndex(index);
      }
    }, 300);

    return () => clearInterval(interval);
  }, [audioRef, lyrics, currentIndex]);

  useEffect(() => {
    if (containerRef.current) {
      const activeLine = containerRef.current.querySelector(".active-line");
      if (activeLine && activeLine.scrollIntoView) {
        activeLine.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [currentIndex]);

  if (!lyricsUrl) {
    return (
      <div className="text-center text-zinc-400 text-sm italic py-4">
        This song does not have lyrics available.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full text-center px-4 overflow-y-auto overflow-x-hidden
                 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent"
    >
      {lyrics.map((line, i) => (
        <p
          key={i}
          onClick={() => {
            if (audioRef.current) {
              audioRef.current.currentTime = line.start;
              if (!audioRef.current.paused) {
                audioRef.current.play();
              }
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
  );
};

export default LyricKaraoke;
