import { useEffect } from "react";
import Topbar from "@/components/Topbar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Play, Pause } from "lucide-react";

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const RecentlyPlayedPage = () => {
  const { listeningHistory, fetchListeningHistory } = useMusicStore();
  const { currentSong, isPlaying, playAlbum, togglePlay } = usePlayerStore();

  useEffect(() => {
    fetchListeningHistory();
  }, [fetchListeningHistory]);

  // Lọc trùng liên tiếp và giới hạn 25 bài
  const filteredHistory = listeningHistory.filter((song, index, arr) => {
    if (index === 0) return true;
    return song._id !== arr[index - 1]._id;
  }).slice(0, 20);

  const handlePlay = (index: number) => {
    const song = filteredHistory[index];
    if (song._id === currentSong?._id) {
      togglePlay();
    } else {
      playAlbum(filteredHistory, index);
    }
  };

  return (
    <div className="h-full rounded-md">
      <Topbar />
      <ScrollArea className="h-full rounded-md">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            {/* <div className="bg-gradient-to-br from-yellow-500 to-pink-500 size-20 flex items-center justify-center rounded text-white text-3xl font-bold">
              ⏱️
            </div> */}
            <div>
              {/* <p className="text-sm text-white font-medium">Playlist</p> */}
              <h1 className="text-4xl md:text-2xl font-bold text-white mt-1">Nghe gần đây</h1>
              {/* <p className="text-zinc-300 text-sm mt-1">{filteredHistory.length} bài hát</p> */}
            </div>
          </div>

          <div className="space-y-2">
            {filteredHistory.map((song, index) => {
              const isCurrent = song._id === currentSong?._id;

              return (
                <div
                  key={`${song._id}-${index}`} // thêm index để tránh trùng key nếu bài trùng không liền kề
                  onClick={() => handlePlay(index)}
                  className="flex items-center gap-4 p-3 rounded hover:bg-white/10 cursor-pointer"
                >
                  <img src={song.imageUrl} className="size-12 rounded" />
                  <div className="flex-1">
                    <div className="text-white font-medium">{song.title}</div>
                    <div className="text-zinc-400 text-sm">{song.artist}</div>
                  </div>

                  <div className="w-20 text-center text-sm text-zinc-400">
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
