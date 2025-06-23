import { Song }  from "@/types";
import  {LyricLine }   from "@/types";

export const getBasicScore = (
  lyrics: LyricLine[],
  volumeTimeline: { time: number; volume: number }[],
  song: Song,
  threshold = 10,
  audioStartAt: number // thêm vào
) => {
  let correct = 0;

  for (const line of lyrics) {
    const hasVoice = volumeTimeline.some(
      (v) =>
        v.time >= line.start * 1000 + audioStartAt &&
        v.time <= line.end * 1000 + audioStartAt &&
        v.volume > threshold
    );
    if (hasVoice) correct += 1;
  }

  const total = lyrics.length;
  const score = Math.round((correct / total) * 100);

  console.log(`[🎵 SCORE] Bài: ${song.title} | Điểm: ${score}`);
  return { score, correct, total, songTitle: song.title, artist: song.artist.name, genre: song.genre };
};
