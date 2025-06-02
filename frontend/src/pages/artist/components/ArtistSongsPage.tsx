import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Song } from "@/types";
import Topbar from "@/components/Topbar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import PlayButton from "@/pages/home/components/PlayButton";
import LikeButton from "@/pages/home/components/LikeButton";

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};


const ArtistSongsPage = () => {
  const { artistId } = useParams();
  const { songs, fetchSongs } = useMusicStore();
  const { playAlbum, currentSong, isPlaying, togglePlay } = usePlayerStore();
  const [artistSongs, setArtistSongs] = useState<Song[]>([]);

  useEffect(() => {
    fetchSongs();
  }, []);

  useEffect(() => {
    const filtered = songs.filter((s) =>
      typeof s.artist === "object" ? s.artist._id === artistId : s.artist === artistId
    );
    setArtistSongs(filtered);
  }, [songs, artistId]);

const handlePlayAll = () => {
  if (artistSongs.length > 0) {
    const first = artistSongs[0];
    if (currentSong?._id !== first._id) {
      playAlbum(artistSongs, 0);
    } else {
      togglePlay();
    }
  }
};


  const isCurrentArtistPlaying = artistSongs.some(song => song._id === currentSong?._id);

  return (
    <div className="h-full">
      <Topbar />
      <ScrollArea className="h-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-white">Tất cả bài hát</h1>
          <Button
            onClick={() => isCurrentArtistPlaying ? togglePlay() : handlePlayAll()}
            size="icon"
            className="w-12 h-12 rounded-full bg-green-500 hover:bg-green-400"
          >
            {isPlaying && isCurrentArtistPlaying ? (
              <Pause className="h-6 w-6 text-black" />
            ) : (
              <Play className="h-6 w-6 text-black" />
            )}
          </Button>
        </div>
        <div className="space-y-4">
          {artistSongs.map((song) => (
            <div
              key={song._id}
              className="flex items-center justify-between bg-zinc-800 p-3 rounded-md hover:bg-zinc-700"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src={song.imageUrl} alt={song.title} className="size-12 rounded" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <PlayButton song={song}  />
                  </div>
                </div>
                <div className="text-white">
                  <div className="font-medium truncate">{song.title}</div>
                  <div className="text-xs text-zinc-400 truncate">
                    {typeof song.artist === "object" ? song.artist.name : song.artist}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-zinc-400 text-center">
                    {formatDuration(song.duration)}
                  </div>
                <LikeButton song={song} className="text-purple-400 hover:text-purple-500" />
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ArtistSongsPage;
