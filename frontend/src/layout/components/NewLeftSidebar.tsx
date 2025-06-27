import PlaylistSkeleton from "@/components/skeletons/PlaylistSkeleton";
import { buttonVariants } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import CreatePlaylistButton from "@/pages/playlist/components/CreatePlaylistButton";
import { useArtistStore } from "@/stores/useArtistStore";
import { usePremiumStore } from "@/stores/usePremiumStore";
import { SignedIn } from "@clerk/clerk-react";
import { useAuth } from "@clerk/clerk-react";
import {
  Clock,
  Heart,
  HomeIcon,
  LineChart,
  Mic2,
  Music2,
  PlaySquare,
  Radio,
  Star,
  Upload,
  Album as AlbumIcon,
  ListMusic,
  Plus,
  User2,
  Tag,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const LeftSidebar = () => {
  const { isSignedIn } = useAuth();
  const { artists, fetchArtists, fetchFollowersCount, isLoading } = useArtistStore();
  const [followersMap, setFollowersMap] = useState<Record<string, number>>({});
  const { isPremium, fetchPremiumStatus } = usePremiumStore();
  useEffect(() => {
    fetchPremiumStatus();
    }, []);

  useEffect(() => {
    const load = async () => {
      await fetchArtists(1, 10, "", isSignedIn ?? false);
    };
    load();
  }, [fetchArtists, isSignedIn]);

  useEffect(() => {
    const fetchCounts = async () => {
      const map: Record<string, number> = {};
      await Promise.all(
        artists.map(async (artist) => {
          const count = await fetchFollowersCount(artist._id);
          map[artist._id] = count;
        })
      );
      setFollowersMap(map);
    };

    if (artists.length > 0) {
      fetchCounts();
    }
  }, [artists, fetchFollowersCount]);

return (
  <div className="h-full flex flex-col bg-[#1c1c1c] text-white">
    {/* Scrollable nội dung */}
    <div className="flex-1 overflow-hidden">
      <ScrollArea className="h-full">
        <div className="px-4 py-4 space-y-2">
          <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#2a2a2a]">
            <HomeIcon className="size-5" />
            <span className="truncate">Trang chủ</span>
          </Link>
          <Link to="/zing-chart" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#2a2a2a]">
            <Tag className="size-5 text-purple-500" />
            <span className="truncate">Tag</span>
          </Link>
          <Link to="/recently-played" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#2a2a2a]">
            <Clock className="size-5 text-purple-400" />
            <span className="truncate">Nghe gần đây</span>
          </Link>
          <Link to="/liked-songs" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#2a2a2a]">
            <Heart className="size-5 text-cyan-400" />
            <span className="truncate">Bài hát yêu thích</span>
          </Link>
          <Link to="/playlists" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#2a2a2a]">
            <ListMusic className="size-5 text-orange-400" />
            <span className="truncate">Playlist</span>
          </Link>
          
          

          {!isPremium && (
            <div className="mt-4 bg-gradient-to-br from-purple-500 to-yellow-400 p-3 rounded-lg text-center">
                <p className="text-sm font-medium text-white mb-2">
                Nghe nhạc không quảng cáo cùng kho nhạc PREMIUM
                </p>
                <button
                className="bg-yellow-400 hover:bg-yellow-300 text-black text-sm font-semibold px-3 py-1 rounded"
                onClick={() => window.open("/premium", "_blank")}
                >
                NÂNG CẤP TÀI KHOẢN
                </button>
            </div>
            )}
        </div>
      </ScrollArea>
    </div>

    {/* Neo dưới cố định */}
    
    {/* <div className="p-4 border-t border-zinc-700 shrink-0">
      <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#2a2a2a] rounded-md">
        <Plus className="size-5 shrink-0" />
        <span className="truncate">Tạo playlist mới</span>
      </button>
    </div> */}
    <CreatePlaylistButton 
      trigger={
        <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#2a2a2a] rounded-md">
          <Plus className="size-5 shrink-0" />
          <span className="truncate">Tạo playlist mới</span>
        </button>
      }
    />
  </div>
);

};

export default LeftSidebar;
