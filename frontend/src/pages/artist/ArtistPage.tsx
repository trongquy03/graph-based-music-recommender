import { useEffect } from "react";
import { useArtistStore } from "@/stores/useArtistStore";
import { FollowButton } from "./components/FollowButtonProps";
import { ScrollArea } from "@/components/ui/scroll-area";
import Topbar from "@/components/Topbar";

const ArtistsPage = () => {
  const { artists, fetchArtists, isLoading } = useArtistStore();

  useEffect(() => {
    fetchArtists();
  }, [fetchArtists]);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="h-full rounded-md">
      <Topbar />
      <ScrollArea className="h-full rounded-md p-6">
        <h1 className="text-3xl font-bold mb-6 text-white">Artists</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {artists.map((artist) => (
            <div
              key={artist._id}
              className="bg-zinc-800 p-4 rounded-lg shadow-md hover:shadow-lg transition"
            >
              <img
                src={artist.imageUrl}
                alt={artist.name}
                className="w-full h-40 object-cover rounded-md mb-3"
              />
              <h2 className="text-xl font-semibold text-white mb-1">
                {artist.name}
              </h2>
              <p className="text-sm text-white/70 mb-3 line-clamp-2">
                {artist.bio}
              </p>
              <FollowButton artistId={artist._id} />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ArtistsPage;
