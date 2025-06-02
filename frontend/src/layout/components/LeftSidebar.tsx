import PlaylistSkeleton from "@/components/skeletons/PlaylistSkeleton";
import { buttonVariants } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useArtistStore } from "@/stores/useArtistStore";
import { SignedIn } from "@clerk/clerk-react";
import { useAuth } from "@clerk/clerk-react";
import {
  Clock,
  Heart,
  HomeIcon,
  MessageCircle,
  User2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const LeftSidebar = () => {
  const { isSignedIn } = useAuth();
  const { artists, fetchArtists, fetchFollowersCount, isLoading } = useArtistStore();
  const [followersMap, setFollowersMap] = useState<Record<string, number>>({});

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
    <div className="h-full flex flex-col gap-2">
      {/* Navigation menu */}
      <div className="rounded-lg bg-zinc-900 p-4">
        <div className="space-y-2">
          <Link
            to={"/"}
            className={cn(
              buttonVariants({
                variant: "ghost",
                className: "w-full justify-start text-white hover:bg-zinc-800",
              })
            )}
          >
            <HomeIcon className="mr-2 size-5 " />
            <span className="hidden md:inline">Trang chủ</span>
          </Link>

          <SignedIn>
            {/* <Link
              to={"/chat"}
              className={cn(
                buttonVariants({
                  variant: "ghost",
                  className: "w-full justify-start text-white hover:bg-zinc-800",
                })
              )}
            >
              <MessageCircle className="mr-2 size-5 fill-white" />
              <span className="hidden md:inline">Messages</span>
            </Link> */}

            <Link
              to={"/liked-songs"}
              className={cn(
                buttonVariants({
                  variant: "ghost",
                  className: "w-full justify-start text-white hover:bg-zinc-800",
                })
              )}
            >
              <Heart className="mr-2 size-5 text-pink-500" />
              <span className="hidden md:inline">Bài hát yêu thích</span>
            </Link>

            <Link
              to={"/recently-played"}
              className={cn(
                buttonVariants({
                  variant: "ghost",
                  className: "w-full justify-start text-white hover:bg-zinc-800",
                })
              )}
            >
              <Clock className="mr-2 size-5 text-yellow-400" />
              <span className="hidden md:inline">Nghe gần đây</span>
            </Link>
          </SignedIn>
        </div>
      </div>

      {/* Library section – hiển thị nghệ sĩ */}
      <div className="flex-1 rounded-lg bg-zinc-900 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-white px-2">
            <User2 className="size-5 mr-2" />
            <span className="hidden md:inline">Top nghệ sĩ</span>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className="space-y-2">
            {isLoading ? (
              <PlaylistSkeleton />
            ) : (
              [...artists]
                .sort((a, b) => (b.followersCount ?? 0) - (a.followersCount ?? 0))
                .slice(0, 10)
                .map((artist) => (
                  <Link
                    to={`/artists/${artist._id}`}
                    key={artist._id}
                    className="p-2 hover:bg-zinc-800 rounded-md flex items-center gap-3 group cursor-pointer"
                  >
                    <img
                      src={artist.imageUrl}
                      alt="Artist"
                      className="size-12 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0 hidden md:block">
                      <p className="font-medium truncate">{artist.name}</p>
                      <p className="text-sm text-zinc-400 truncate">
                        {artist.followersCount ?? 0} người theo dõi
                      </p>
                    </div>
                  </Link>
                ))
            )}

          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default LeftSidebar;
