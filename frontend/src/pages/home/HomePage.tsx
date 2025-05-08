import { useMusicStore } from "@/stores/useMusicStore"
import Topbar from "../../components/Topbar"
import { useEffect } from "react";
import FeaturedSection from "./components/FeaturedSection";
import { ScrollArea } from "@/components/ui/scroll-area";
import SectionGrid from "./components/SectionGrid";
import { usePlayerStore } from "@/stores/usePlayerStore";

const HomePage = () => {
  const {fetchFeaturedSongs, 
        fetchTrendingSongs,
        fetchMadeForYouSongs,
        isLoading,
        madeForYouSongs,
        featuredSongs,
        trendingSongs} = useMusicStore();

  const {initializeQueue} = usePlayerStore();

  useEffect(() => {
    fetchFeaturedSongs();
    fetchTrendingSongs();
    fetchMadeForYouSongs();
  }, [fetchFeaturedSongs, fetchTrendingSongs, fetchMadeForYouSongs]);

  useEffect(() => {
		if (madeForYouSongs.length > 0 && featuredSongs.length > 0 && trendingSongs.length > 0) {
			const allSongs = [...featuredSongs, ...madeForYouSongs, ...trendingSongs];
			initializeQueue(allSongs);
		}
	}, [initializeQueue, madeForYouSongs, trendingSongs, featuredSongs]);

  console.log({isLoading, madeForYouSongs, featuredSongs, trendingSongs})
  return (
    <main className="rounded-md overflow-hidden h-full bg-gradient-to-b from-zinc-800 to-zinc-900">
      <Topbar/>
      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="p-4 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6">
            Bài hát nổi bật
          </h1>
          <FeaturedSection />

        <div className="space-y-8">
          <SectionGrid title="Gợi ý cho bạn" songs={madeForYouSongs} isLoading={isLoading}/>
          <SectionGrid title="Nhạc thịnh hành" songs={trendingSongs} isLoading={isLoading}/>
        </div>
        </div>
      </ScrollArea>
      </main>
  )
}

export default HomePage