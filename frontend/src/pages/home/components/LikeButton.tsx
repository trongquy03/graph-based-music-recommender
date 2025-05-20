import { Button } from "@/components/ui/button";
import { useMusicStore } from "@/stores/useMusicStore";
import { Song } from "@/types";
import { Heart} from "lucide-react";
import clsx from "clsx";

const LikeButton = ({ song, className }: { song: Song; className?: string }) => {
  const { likedSongIds, likeSong, unlikeSong } = useMusicStore();
  const isLiked = likedSongIds.includes(song._id);

  const handleToggleLike = () => {
    if (isLiked) unlikeSong(song._id);
    else likeSong(song._id);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggleLike}
      className={clsx(
        "transition-all p-0 h-auto w-auto bg-transparent",
        isLiked ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        className
      )}
    >
      {isLiked ? (
        <Heart className="size-5 fill-red-500 text-red-500" />
      ) : (
        <Heart className="size-5 text-white" />
      )}
    </Button>
  );
};

export default LikeButton;
