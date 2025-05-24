import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useArtistStore } from "@/stores/useArtistStore";

interface FollowButtonProps {
  artistId: string;
}

export const FollowButton = ({ artistId }: FollowButtonProps) => {
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
      const isUserFollowing = await isFollowing(artistId);
      const count = await fetchFollowersCount(artistId);
      setFollowing(isUserFollowing);
      setFollowersCount(count);
    };
    fetchData();
  }, [artistId, isFollowing, fetchFollowersCount]);

  const handleToggleFollow = async () => {
    if (following) {
      await unfollowArtist(artistId);
      setFollowing(false);
      setFollowersCount((prev) => prev - 1);
    } else {
      await followArtist(artistId);
      setFollowing(true);
      setFollowersCount((prev) => prev + 1);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        className="text-sm px-4 py-1 rounded-full"
        onClick={handleToggleFollow}
      >
        {following ? "Unfollow" : "Follow"}
      </Button>
      <span className="text-xs text-white/60">{followersCount} followers</span>
    </div>
  );
};