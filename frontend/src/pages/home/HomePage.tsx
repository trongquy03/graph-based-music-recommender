import { useMusicStore } from "@/stores/useMusicStore"
import { useUserRecommenderStore } from "@/stores/useRecommenderStore"
import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SignedIn } from "@clerk/clerk-react";
import SectionGrid from "./components/SectionGrid";
import { usePlayerStore } from "@/stores/usePlayerStore";
import ArtistSimilarity from "./components/ArtistSimilarity";
import PersonalizedSection from "../music/components/MusicRecoomendForUser";

const HomePage = () => {
  const { isSignedIn } = useAuth();
  const {
        fetchTrendingSongs,
        isLoading,
        trendingSongs} = useMusicStore();
  const {
    fetchRecommendedSongs,
  } = useUserRecommenderStore();
  const {initializeQueue} = usePlayerStore();

  useEffect(() => {
    fetchTrendingSongs();
    if (isSignedIn) {
      fetchRecommendedSongs();
    }
  }, [fetchRecommendedSongs,fetchTrendingSongs, isSignedIn]);

  useEffect(() => {
		if (trendingSongs.length > 0) {
			const allSongs = [ ...trendingSongs];
			initializeQueue(allSongs);
		}
	}, [initializeQueue, trendingSongs]);

  // console.log({isLoading, madeForYouSongs, featuredSongs, trendingSongs})
  return (
    <main className="rounded-md overflow-hidden h-full bg-gradient-to-b from-zinc-800 to-zinc-900">
      {/* <Topbar/> */}
      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="p-4 sm:p-6">
          {/* <h1 className="text-xl sm:text-2xl font-bold mb-6">
            
          </h1> */}
          {/* <FeaturedCarousel /> */}
          {/* <AlbumBannerCarousel /> */}
          <ArtistSimilarity />
          
          {/* <FeaturedSection/> */}
          <SignedIn>
            <p className="text-2xl font-bold mb-6">Gợi ý cho bạn</p>
            <PersonalizedSection/>
          </SignedIn>
          

        <div className="space-y-8">
          {/* <SectionGrid title="Gợi ý cho bạn" songs={madeForYouSongs} isLoading={isLoading}/> */}
           
          <SectionGrid title="Nhạc thịnh hành" songs={trendingSongs} isLoading={isLoading}/>
          {/* <FeaturedSection /> */}
        </div>
        </div>
      </ScrollArea>
      </main>
  )
}

export default HomePage