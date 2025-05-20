import { useMusicStore } from "@/stores/useMusicStore";
import FeaturedGridSkeleton from "@/components/skeletons/FeaturedGridSkeleton";
import PlayButton from "./PlayButton";
import LikeButton from "./LikeButton";
import { useAuth } from "@clerk/clerk-react";

const FeaturedSection = () => {
  const { isLoading, featuredSongs, error } = useMusicStore();
  const { isSignedIn } = useAuth();

  if (isLoading) return <FeaturedGridSkeleton />;

  if (error) return <p className="text-red-500 mb-4 text-lg">{error}</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {featuredSongs.map((song) => (
        <div
          key={song._id}
          className="flex items-center bg-zinc-800/50 rounded-md overflow-hidden
            hover:bg-zinc-700/50 transition-colors group cursor-pointer relative"
        >
          <div className="relative">
            <img
              src={song.imageUrl}
              alt={song.title}
              className="w-16 sm:w-20 h-16 sm:h-20 object-cover flex-shrink-0"
            />
  
			{isSignedIn && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
              <LikeButton song={song} className="scale-90" />
            	</div>
            	)}
          	</div>

          <div className="flex-1 p-4">
            <p className="font-medium truncate">{song.title}</p>
            <p className="text-sm text-zinc-400 truncate">{song.artist}</p>
          </div>

          <div className="pr-4">
            <PlayButton song={song} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default FeaturedSection;
