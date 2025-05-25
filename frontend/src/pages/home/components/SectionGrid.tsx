import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import SectionGridSkeleton from "@/components/skeletons/SectionGridSkeleton";
import { Button } from "@/components/ui/button";
import { Song } from "@/types";
import PlayButton from "./PlayButton";
import LikeButton from "./LikeButton";
import { useMusicStore } from "@/stores/useMusicStore";
import { useRatingStore } from "@/stores/useRatingStore";
import { Star } from "lucide-react";

type SectionGridProps = {
  title: string;
  songs: Song[];
  isLoading: boolean;
};

const SectionGrid = ({ songs, title, isLoading }: SectionGridProps) => {
  const [showAll, setShowAll] = useState(false);
  const { isSignedIn } = useAuth();
  const { likedSongIds } = useMusicStore();
  const {
    getAverageRatingForSong,
    getUserRatingForSong,
  } = useRatingStore();

  if (!isSignedIn && title === "Gợi ý cho bạn") return null;
  if (isLoading) return <SectionGridSkeleton />;

  const songsToDisplay = showAll ? songs : songs.slice(0, 5);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-bold">{title}</h2>
        {songs.length > 5 && (
          <Button
            variant="link"
            className="text-sm text-zinc-400 hover:text-white cursor-pointer"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Thu gọn" : "Xem tất cả"}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
        {songsToDisplay.map((song) => (
          <div
            key={song._id}
            className="bg-zinc-800/40 p-3 rounded-md hover:bg-zinc-700/40 transition-all"
          >
            <div className="relative group mb-4">
              {isSignedIn && (
                <LikeButton
                  song={song}
                  className={`absolute top-3 right-2 z-10 transition-opacity scale-150 cursor-pointer ${
                    likedSongIds.includes(song._id)
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  }`}
                />
              )}

              <div className="aspect-square rounded-md shadow-lg overflow-hidden">
                <img
                  src={song.imageUrl}
                  alt={song.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              <PlayButton song={song} />
            </div>

            <h3 className="font-medium mb-2 truncate">{song.title}</h3>
            <p className="text-sm text-zinc-400 truncate">
              {typeof song.artist === "object" ? song.artist.name : song.artist}
            </p>

            <div className="flex items-center gap-1 mt-1 text-[11px] text-white">
              <Star
                className={`w-3.5 h-3.5 ${
                  getUserRatingForSong(song._id)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-white"
                }`}
              />
              <span>
                {(getAverageRatingForSong(song._id).average || 0).toFixed(1)}/5 (
                {getAverageRatingForSong(song._id).totalRatings})
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SectionGrid;
