import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useArtistStore } from "@/stores/useArtistStore";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { FollowButton } from "./components/FollowButtonProps";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@clerk/clerk-react";
import Topbar from "@/components/Topbar";
import LikeButton from "../home/components/LikeButton";
import PlayButton from "../home/components/PlayButton";
import { Button } from "@/components/ui/button";
import { Pause, Play } from "lucide-react";

const ArtistDetailPage = () => {
  const { isSignedIn } = useAuth();
  const { artistId } = useParams();
  const navigate = useNavigate();
  const { artists, fetchArtists, fetchFollowersCount } = useArtistStore();
  const { albums, songs, fetchAlbums, fetchSongs } = useMusicStore();
  const { playAlbum, currentSong, isPlaying, togglePlay } = usePlayerStore();

  const [artist, setArtist] = useState<any>(null);
  const [followers, setFollowers] = useState(0);

  useEffect(() => {
    fetchArtists(1, 20, "", isSignedIn ?? false);
    fetchAlbums();
    fetchSongs(1, 50, { artist: artistId });

    fetchFollowersCount(artistId!).then(setFollowers);
  }, [artistId, isSignedIn]);

  useEffect(() => {
    const found = artists.find((a) => a._id === artistId);
    if (found) setArtist(found);
  }, [artists, artistId]);

  if (!artist) return <div>Loading...</div>;

  const artistAlbums = albums.filter((a) =>
    typeof a.artist === "object" ? a.artist._id === artistId : a.artist === artistId
  );

  const artistSongs = songs.filter((s) =>
    typeof s.artist === "object" ? s.artist._id === artistId : s.artist === artistId
  );

  const topSongs = artistSongs.slice(0, 6);
  const topAlbums = artistAlbums.slice(0, 3);

  const handlePlayAll = () => {
  if (artistSongs.length > 0) {
    playAlbum(artistSongs, 0);
  } else {
    console.warn("Artist has no songs to play.");
  }
};


  const isCurrentArtistPlaying = artistSongs.some(song => song._id === currentSong?._id);

  return (
    <div className="h-full rounded-md">
      <Topbar />
      <ScrollArea className="h-full rounded-md">
        <div className="relative">
          <div className="w-full h-[300px] bg-gradient-to-b from-purple-700/80 to-black relative flex items-end p-6">
            <img
              src={artist.imageUrl}
              alt={artist.name}
              className="w-36 h-36 rounded-full border-4 border-white shadow-lg object-cover"
            />
            <div className="ml-6 text-white">
  <div className="flex items-center gap-4">
    <h1 className="text-4xl font-bold">{artist.name}</h1>
    <Button
      onClick={() => isCurrentArtistPlaying ? togglePlay() : handlePlayAll()}
      size="icon"
      className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-400 hover:scale-105 transition-all"
    >
      {isPlaying && isCurrentArtistPlaying ? (
        <Pause className="h-5 w-5 text-black" />
      ) : (
        <Play className="h-5 w-5 text-black" />
      )}
    </Button>
  </div>
              <div className="mt-2">
                <FollowButton artistId={artist._id} />
              </div>
            </div>
          </div>

          {/* Bài hát nổi bật */}
          <div className="px-6 mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl text-white font-semibold">Bài Hát Nổi Bật</h2>
              {artistSongs.length > 6 && (
            <button
              onClick={() => navigate(`/artists/${artist._id}/songs`)}
              className="text-sm text-purple-400 hover:underline"
            >
              Xem tất cả
            </button>
          )}

            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topSongs.map((song) => (
                <div
                  key={song._id}
                  className="flex items-center gap-3 bg-zinc-800 p-3 rounded-md group hover:bg-zinc-700 transition relative"
                >
                  <div className="relative">
                    <img src={song.imageUrl} alt={song.title} className="size-12 rounded" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <LikeButton song={song} />
                    </div>
                  </div>
                  <div className="text-white flex-1 overflow-hidden">
                    <div className="font-medium truncate">{song.title}</div>
                    <div className="text-xs text-zinc-400 truncate">
                      {typeof song.artist === "object" ? song.artist.name : song.artist}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <PlayButton song={song} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Albums */}
          <div className="px-6 mt-8">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl text-white font-semibold">Album</h2>
              {artistAlbums.length > 3 && (
                <button
                  onClick={() => navigate(`/artists/${artistId}/albums`)}
                  className="text-sm text-purple-400 hover:underline"
                >
                  Xem tất cả
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {topAlbums.map((album) => (
                <div
                  key={album._id}
                  onClick={() => navigate(`/albums/${album._id}`)}
                  className="text-white cursor-pointer hover:opacity-90"
                >
                  <img
                    src={album.imageUrl}
                    alt={album.title}
                    className="w-full h-48 object-cover rounded-md mb-2"
                  />
                  <p className="text-sm font-medium truncate">{album.title}</p>
                  <p className="text-xs text-zinc-400">{album.releaseYear}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div className="px-6 mt-8 pb-12">
            <h2 className="text-xl text-white font-semibold mb-2">Về {artist.name}</h2>
            <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{artist.bio}</p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default ArtistDetailPage;
