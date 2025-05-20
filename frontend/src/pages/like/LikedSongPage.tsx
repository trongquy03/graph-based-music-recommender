import Topbar from "@/components/Topbar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Clock, Heart, Pause, Play } from "lucide-react";
import { useEffect } from "react";

export const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const LikedSongsPage = () => {
  const {
    songs,
    likedSongIds,
    fetchSongs,
    fetchLikedSongs,
    unlikeSong,
  } = useMusicStore();

  const {
    currentSong,
    isPlaying,
    togglePlay,
    playAlbum,
    
  } = usePlayerStore();

  useEffect(() => {
    fetchSongs();
    fetchLikedSongs();
  }, [fetchSongs, fetchLikedSongs]);

  const likedSongs = songs.filter((song) => likedSongIds.includes(song._id));

  const handlePlayLiked = () => {
    if (likedSongs.length === 0) return;
    const isCurrentLikedPlaying = likedSongs.some(
      (song) => song._id === currentSong?._id
    );
    if (isCurrentLikedPlaying) togglePlay();
    else playAlbum(likedSongs, 0);
  };

  const handlePlaySong = (index: number) => {
    playAlbum(likedSongs, index);
  };

  const handleUnlike = (e: React.MouseEvent, songId: string) => {
    e.stopPropagation();
    unlikeSong(songId);
  };

  return (
    <div className="h-full rounded-md">
      <Topbar />
      <ScrollArea className="h-full rounded-md">
        <div className="relative min-h-full">
          <div
            className="absolute inset-0 bg-gradient-to-b from-pink-500/80 via-zinc-900/80
              to-zinc-900 pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative z-10">
            <div className="flex p-6 gap-6 pb-8">
              <div
                className="w-[240px] h-[240px] shadow-xl rounded bg-gradient-to-br
                from-pink-500 to-purple-700 flex items-center justify-center text-white text-6xl font-bold"
              >
                ❤
              </div>
              <div className="flex flex-col justify-end">
                <p className="text-sm font-medium">Playlist</p>
                <h1 className="text-7xl font-bold my-4">Bài hát yêu thích</h1>
                <div className="flex items-center gap-2 text-sm text-zinc-100">
                  <span className="font-medium text-white">
                    {likedSongs.length} bài hát
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 pb-4 flex items-center gap-6">
              <Button
                onClick={handlePlayLiked}
                size="icon"
                className="w-14 h-14 rounded-full bg-green-500 
                  hover:bg-green-400 hover:scale-105 transition-all"
              >
                {isPlaying && likedSongs.some((s) => s._id === currentSong?._id) ? (
                  <Pause className="h-7 w-7 text-black" />
                ) : (
                  <Play className="h-7 w-7 text-black" />
                )}
              </Button>
            </div>

            <div className="bg-black/20 backdrop-blur-sm">
              <div
                className="grid grid-cols-[16px_4fr_2fr_1fr] gap-4 px-10 py-2 text-sm 
                  text-zinc-400 border-b border-white/5"
              >
                <div>#</div>
                <div>Tiêu đề</div>
                <div >
                  <Clock className="h-4 w-4" />
                </div>

                <div className="flex items-center justify-end pr-4">
                    <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                </div>
              </div>

              <div className="px-6">
                <div className="space-y-2 py-4">
                  {likedSongs.map((song, index) => {
                    const isCurrentSong = song._id === currentSong?._id;
                    return (
                      <div
                        key={song._id}
                        onClick={() => handlePlaySong(index)}
                        className="grid grid-cols-[16px_4fr_2fr_1fr] gap-4 px-4 py-2 text-sm 
                          text-zinc-400 hover:bg-white/5 rounded-md group cursor-pointer"
                      >
                        <div className="flex items-center justify-center">
                          {isCurrentSong && isPlaying ? (
                            <div className="size-4 text-green-500">♫</div>
                          ) : (
                            <span className="group-hover:hidden">{index + 1}</span>
                          )}
                          {!isCurrentSong && (
                            <Play className="h-4 w-4 hidden group-hover:block" />
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <img
                            src={song.imageUrl}
                            alt={song.title}
                            className="size-10"
                          />
                          <div>
                            <div className="font-medium text-white">{song.title}</div>
                            <div>{song.artist}</div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {formatDuration(song.duration)}
                        </div>

                        <div className="flex items-center justify-end pr-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => handleUnlike(e, song._id)}
                            className="text-red-500 hover:text-white cursor-pointer"
                          >
                            <Heart className="fill-red-500 h-5 w-5" />
                          </Button>
                        </div>
                        
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default LikedSongsPage;


