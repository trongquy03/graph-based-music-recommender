import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useArtistStore } from "@/stores/useArtistStore";
import { useAuth } from "@clerk/clerk-react";

interface FollowButtonProps {
  artistId: string;
}

export const FollowButton = ({ artistId }: FollowButtonProps) => {
  const { isSignedIn } = useAuth();
  const {
    isFollowing,
    followArtist,
    unfollowArtist,
    fetchFollowersCount,
  } = useArtistStore();

  const [following, setFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const count = await fetchFollowersCount(artistId);
      setFollowersCount(count);

      if (isSignedIn) {
        try {
          const isUserFollowing = await isFollowing(artistId);
          setFollowing(isUserFollowing);
        } catch (err) {
          console.warn("Không thể kiểm tra trạng thái theo dõi:", err);
        }
      }
    };
    fetchData();
  }, [artistId, isSignedIn, isFollowing, fetchFollowersCount]);

  const handleToggleFollow = async () => {
    if (!isSignedIn) {
      return alert("Vui lòng đăng nhập để theo dõi nghệ sĩ.");
    }

    if (following) {
      await unfollowArtist(artistId);
      setFollowing(false);
      setFollowersCount((prev) => Math.max(0, prev - 1));
    } else {
      await followArtist(artistId);
      setFollowing(true);
      setFollowersCount((prev) => prev + 1);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {isSignedIn && (
        <Button
          variant="outline"
          className="text-sm px-4 py-1 rounded-full"
          onClick={handleToggleFollow}
        >
          {following ? "unfollow" : "follow"}
        </Button>
      )}
      <span className="text-xs text-white/60">{followersCount} followers</span>
    </div>
  );
};
