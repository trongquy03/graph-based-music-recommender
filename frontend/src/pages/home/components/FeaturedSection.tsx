import { useMusicStore } from "@/stores/useMusicStore";
import FeaturedGridSkeleton from "@/components/skeletons/FeaturedGridSkeleton";
import PlayButton from "./PlayButton";
import LikeButton from "./LikeButton";
import { useAuth } from "@clerk/clerk-react";
import { useRatingStore } from "@/stores/useRatingStore";
import { Star } from "lucide-react";
import { useEffect, useRef } from "react";

const FeaturedSection = () => {
  const { isLoading, featuredSongs, error } = useMusicStore();
  const { isSignedIn } = useAuth();
  const {
    getAverageRatingForSong,
    getUserRatingForSong,
    fetchAverageRating,
    fetchAverageRatingsBulk,
  } = useRatingStore();

  const fetchedRef = useRef<Record<string, boolean>>({});

useEffect(() => {
  featuredSongs.forEach((song) => {
    if (!fetchedRef.current[song._id]) {
      fetchedRef.current[song._id] = true;
      fetchAverageRating(song._id);
    }
  });
}, [featuredSongs]);


useEffect(() => {
  if (isSignedIn) {
    useRatingStore.getState().fetchUserRatings(true); 
  }

  const songIds = featuredSongs.map((s) => s._id);
  fetchAverageRatingsBulk(songIds);
}, [featuredSongs, isSignedIn]);



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
              <LikeButton song={song} className="scale-90 cursor-pointer" />
            	</div>
            	)}
          	</div>

          <div className="flex-1 p-4 overflow-hidden">
            <div className="relative overflow-hidden max-w-full">
              <p
                className="font-medium whitespace-nowrap overflow-hidden text-ellipsis 
                max-w-[180px] group-hover:animate-marquee"
              >
                {song.title}
              </p>
            </div>
            <p className="text-sm text-zinc-400 truncate">
            {typeof song.artist === "object" && song.artist !== null
              ? song.artist.name
              : song.artist}
          </p>

              <div className="flex items-center gap-1 mt-1 text-[11px] ">
                {song && song._id && (
                <Star
                  className={`w-3.5 h-3.5 ${
                    getUserRatingForSong(song._id) ? "fill-yellow-400 text-yellow-400" : "fill-white text-white"
                  }`}
                />
              )}

                <span className="text-white">
                  {(getAverageRatingForSong(song._id).average || 0).toFixed(1)}/5
                  {" "}({getAverageRatingForSong(song._id).totalRatings})
                </span>
              </div>


          </div>

          <div className="pr-4">
            <PlayButton song={song}/>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FeaturedSection;
