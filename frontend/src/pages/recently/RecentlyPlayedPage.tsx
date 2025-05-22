import { useEffect, useState, useRef  } from "react";
import Topbar from "@/components/Topbar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Play, Pause, Star, Clock } from "lucide-react";
import { useRatingStore } from "@/stores/useRatingStore";
import RatingSelector from "@/components/RatingSelector";

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const RecentlyPlayedPage = () => {
  const { listeningHistory, fetchListeningHistory } = useMusicStore();
  const {
  ratings,
  fetchUserRatings,
  rateSong,
  fetchAverageRating,
  getAverageRatingForSong,
} = useRatingStore();

  const { currentSong, isPlaying, playAlbum, togglePlay } = usePlayerStore();

  const [ratingMap, setRatingMap] = useState<Record<string, number>>({});
  const [selectedRatingSong, setSelectedRatingSong] = useState<string | null>(null);
  const fetchedAvgRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    fetchListeningHistory();
    fetchUserRatings();
  }, [fetchListeningHistory, fetchUserRatings]);

  useEffect(() => {
    const map: Record<string, number> = {};
    ratings.forEach((r) => {
      map[r.song._id] = r.rating;
    });
    setRatingMap(map);
  }, [ratings]);

  const filteredHistory = listeningHistory
    .filter((song, index, arr) => {
      if (!song || !arr[index - 1]) return true;
      if (index === 0) return true;
      return song._id !== arr[index - 1]._id;
    })
    .filter(Boolean)
    .slice(0, 20);

    useEffect(() => {
      filteredHistory.forEach((song) => {
        if (!fetchedAvgRef.current[song._id]) {
          fetchedAvgRef.current[song._id] = true;
          fetchAverageRating(song._id);
        }
      });
    }, [filteredHistory]);



  const handlePlay = (index: number) => {
    const song = filteredHistory[index];
    if (song._id === currentSong?._id) {
      togglePlay();
    } else {
      playAlbum(filteredHistory, index);
    }
  };

  const handleRate = (e: React.MouseEvent, songId: string) => {
    e.stopPropagation();
    setSelectedRatingSong(songId === selectedRatingSong ? null : songId);
  };

  const handleSelectRating = (songId: string, value: number) => {
    rateSong(songId, value);
    setRatingMap((prev) => ({ ...prev, [songId]: value }));
    setSelectedRatingSong(null);
  };

  const handleClearRating = (songId: string) => {
    rateSong(songId, 0); // hoặc gọi API DELETE
    setRatingMap((prev) => ({ ...prev, [songId]: 0 }));
    setSelectedRatingSong(null);
  };

  return (
    <div className="h-full rounded-md">
      <Topbar />
      <ScrollArea className="h-full rounded-md">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            {/* <div className="bg-gradient-to-br from-yellow-500 to-pink-500 size-10 flex items-center justify-center rounded text-white text-3xl font-bold">
              <Clock className="size-20 text-white" />
            </div> */}
            {/* <Clock className="size-20 text-white" /> */}
            <div>
              <h1 className="text-4xl md:text-2xl font-bold text-white mt-1">Nghe gần đây</h1>
            </div>
          </div>

          <div className="space-y-2">
            {filteredHistory.map((song, index) => {
              const isCurrent = song._id === currentSong?._id;
              const currentRating = ratingMap[song._id] ?? 0;

              return (
                <div
                  key={`${song._id}-${index}`}
                  onClick={() => handlePlay(index)}
                  className="grid grid-cols-[auto_1fr_120px_60px_40px] items-center gap-4 p-3 rounded hover:bg-white/10 cursor-pointer relative"
                >
                  <img src={song.imageUrl} className="size-12 rounded" />
                  <div className="flex flex-col">
                    <div className="text-white font-medium">{song.title}</div>
                    <div className="text-zinc-400 text-sm">{song.artist}</div>
                  </div>

                  <div className="relative flex items-center justify-center gap-2">
                    <div
                      onClick={(e) => handleRate(e, song._id)}
                      className="cursor-pointer"
                    >
                      <Star
                        className={`h-5 w-5 transition ${
                          currentRating > 0 ? "fill-yellow-400" : "text-zinc-500"
                        }`}
                      />
                    </div>
                    <span className="text-sm text-white/60">
                  {(getAverageRatingForSong(song._id).average || 0).toFixed(1)}/5 
                  ({getAverageRatingForSong(song._id).totalRatings})
                </span>


                    {selectedRatingSong === song._id && (
                      <div className="absolute top-7 z-50">
                        <RatingSelector
                          current={currentRating}
                          onSelect={(val) => handleSelectRating(song._id, val)}
                          onClear={() => handleClearRating(song._id)}
                        />
                      </div>
                    )}
                  </div>

                  <div className="text-sm text-zinc-400 text-center">
                    {formatDuration(song.duration)}
                  </div>

                  {isCurrent && isPlaying ? (
                    <Pause className="h-4 w-4 text-green-500" />
                  ) : (
                    <Play className="h-4 w-4 text-zinc-300" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default RecentlyPlayedPage;
