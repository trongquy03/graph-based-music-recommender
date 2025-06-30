"use client";

import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useMusicStore } from "@/stores/useMusicStore";
import { useRatingStore } from "@/stores/useRatingStore";
import { useAuth } from "@clerk/clerk-react";
import PlayButton from "../home/components/PlayButton";
import LikeButton from "../home/components/LikeButton";
import MusicRecommendSection from "./components/MusicRecommend";
import CommentPanelV2 from "../comment/CommentForMusicDetail";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Song } from "@/types";
import { useUserRecommenderStore } from "@/stores/useRecommenderStore";
import { usePremiumStore } from "@/stores/usePremiumStore"; // ✅ Thêm dòng này

const MusicDetailPage = () => {
  const { songId } = useParams();
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();
  const {
    fetchSongById,
    fetchFeaturedSongs,
    isLoading,
    featuredSongs,
  } = useMusicStore();
  const {
    fetchUserRatings,
    rateSong,
    deleteRating,
    getUserRatingForSong,
    getAverageRatingForSong,
    fetchAverageRating,
  } = useRatingStore();

  const { fetchSimilarSongs } = useUserRecommenderStore();
  const [similarSongs, setSimilarSongs] = useState<Song[]>([]);

  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!songId) return;
      setLoading(true);
      const song = await fetchSongById(songId);
      setCurrentSong(song);
      await fetchAverageRating(songId);
      await fetchUserRatings(!!isSignedIn);
      fetchFeaturedSongs();

      const similar = await fetchSimilarSongs(songId);
      setSimilarSongs(similar);
      setLoading(false);
    };
    load();
  }, [songId]);

  if (loading || !currentSong) {
    return <div className="text-white p-8 text-lg">Đang tải bài hát...</div>;
  }

  const avg = getAverageRatingForSong(currentSong._id);
  const userRating = getUserRatingForSong(currentSong._id);
  const isPremiumUser = usePremiumStore.getState().isPremium;

  return (
    <main className="rounded-md overflow-hidden h-full bg-gradient-to-b from-zinc-800 to-zinc-900">
    <ScrollArea className="h-[calc(100vh-180px)]">
      <div className="p-4 space-y-6">
    <div className="p-4 space-y-6">
      {/* Top section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 bg-zinc-900 p-4 rounded-lg shadow-md">
          <div className="flex gap-4">
            <img
              src={currentSong.imageUrl}
              alt={currentSong.title}
              className="w-32 h-32 rounded object-cover"
            />
            <div className="flex flex-col justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">{currentSong.title}</h2>

                {/* Artist */}
                <button
                  onClick={() => navigate(`/artists/${currentSong.artist._id}`)}
                  className="text-sm text-blue-400 hover:underline"
                >
                  {currentSong.artist.name}
                </button>

                {/* Tags */}
                {currentSong.tags && currentSong.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {currentSong.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-zinc-700 text-white text-xs px-2 py-1 rounded-full"
                        title={tag.type}
                      >
                        #{tag.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Ratings */}
                <div className="mt-2 text-sm text-zinc-400 flex items-center gap-2">
                  <span className="text-yellow-400">
                    {"★".repeat(Math.round(avg.average || 0)) +
                      "☆".repeat(5 - Math.round(avg.average || 0))}
                  </span>
                  <span>
                    {avg.average.toFixed(1)} / 5 ({avg.totalRatings} đánh giá)
                  </span>
                  {isSignedIn && (
                    <>
                      <span>•</span>
                      {userRating ? (
                        <button
                          onClick={() => deleteRating(currentSong._id)}
                          className="text-red-400 hover:underline"
                        >
                          Bỏ đánh giá ({userRating}★)
                        </button>
                      ) : (
                        <div className="flex gap-1 items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => rateSong(currentSong._id, star)}
                              className="text-zinc-400 hover:text-yellow-400"
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-4 items-center">
                <PlayButton song={currentSong} />
                {isSignedIn && <LikeButton song={currentSong} />}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Video */}
        {currentSong.youtubeUrl && (!currentSong.isPremium || isPremiumUser) ? (
          <div className="w-full aspect-video rounded-lg overflow-hidden bg-black shadow-lg">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${extractYoutubeId(currentSong.youtubeUrl)}`}
              title={currentSong.title}
              frameBorder="0"
              allowFullScreen
            ></iframe>
          </div>
        ) : (
          <div className="w-full h-full text-center text-zinc-500 flex justify-center items-center bg-zinc-800 rounded-lg">
            {currentSong.youtubeUrl ? "Chỉ dành cho tài khoản Premium" : "Không có video"}
          </div>
        )}
      </div>

      {/* Gợi ý */}
      <div>
        <h3 className="text-xl font-semibold text-white mb-2">Có thể bạn sẽ thích</h3>
        <MusicRecommendSection songs={similarSongs} />
      </div>

      {/* Bình luận */}
<div>
  {/* <h3 className="text-xl font-semibold text-white mb-2">Bình luận</h3> */}
  <CommentPanelV2 songId={currentSong._id} />
</div>

    </div>
    </div>
    </ScrollArea>
  </main>
  );
};

function extractYoutubeId(url: string) {
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|watch)\??v?=?|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;
  const match = url.match(regex);
  return match ? match[1] : "";
}

export default MusicDetailPage;
