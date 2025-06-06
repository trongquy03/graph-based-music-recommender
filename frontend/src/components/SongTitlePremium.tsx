import { Badge } from "@/components/ui/badge";
import { Song } from "@/types";

interface Props {
  song: Song;
  className?: string;
}

export const SongTitlePremium = ({ song, className = "" }: Props) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="font-medium text-white">{song.title}</span>
      {song.isPremium && (
        <Badge className="bg-yellow-500 text-black text-[10px] px-2 py-0.5 rounded-sm">
          PREMIUM
        </Badge>
      )}
    </div>
  );
};
