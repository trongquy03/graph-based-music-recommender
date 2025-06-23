// utils/parseSRT.ts
import { LyricLine } from "@/types";

export const parseSRT = (srt: string): LyricLine[] => {
  const blocks = srt.replace(/\r/g, "").replace(/\uFEFF/g, "").trim().split(/\n{2,}/);
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
    const textLines = lines.filter((line) => !/^\d+$/.test(line) && !line.includes("-->"));
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
