import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import toast from "react-hot-toast";
import { Song } from "@/types";

interface Rating {
  _id: string;
  song: Song;
  user: string;
  rating: number;
}

interface AverageRating {
  average: number;
  totalRatings: number;
}

interface RatingStore {
  ratings: Rating[];
  averageRatings: Record<string, AverageRating>;
  isLoading: boolean;
  error: string | null;

  fetchUserRatings: (isSignedIn: boolean) => Promise<void>;
  rateSong: (songId: string, rating: number) => Promise<void>;
  deleteRating: (songId: string) => Promise<void>;
  fetchAverageRating: (songId: string) => Promise<void>;
  fetchAverageRatingsBulk: (songIds: string[]) => Promise<void>;
  getUserRatingForSong: (songId: string) => number | null;
  getAverageRatingForSong: (songId: string) => AverageRating;
}

export const useRatingStore = create<RatingStore>((set, get) => ({
  ratings: [],
  averageRatings: {},
  isLoading: false,
  error: null,

  fetchUserRatings: async (isSignedIn) => {
    if (!isSignedIn) return;
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.get("/ratings");
      set({ ratings: res.data });
    } catch (error: any) {
      if (error?.response?.status !== 401) {
        toast.error("Không thể tải đánh giá");
        set({ error: error.message });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  rateSong: async (songId, rating) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.post("/ratings", { songId, rating });
      toast.success("Đã đánh giá bài hát");
      await Promise.all([
        get().fetchUserRatings(true),
        get().fetchAverageRating(songId),
      ]);
    } catch (error: any) {
      toast.error("Không thể đánh giá");
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteRating: async (songId) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.delete("/ratings", { data: { songId } });
      toast.success("Đã xoá đánh giá");
      await get().fetchUserRatings(true);
      await get().fetchAverageRating(songId);
    } catch (error: any) {
      toast.error("Không thể xoá đánh giá");
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAverageRating: async (songId) => {
    try {
      const res = await axiosInstance.get(`/ratings/average/${songId}`);
      set((state) => ({
        averageRatings: {
          ...state.averageRatings,
          [songId]: res.data,
        },
      }));
    } catch (error: any) {
      console.error("Lỗi khi lấy điểm trung bình", error);
    }
  },

  fetchAverageRatingsBulk: async (songIds) => {
    const { averageRatings } = get();
    const pendingIds = songIds.filter((id) => !averageRatings[id]);

    await Promise.all(
      pendingIds.map(async (id) => {
        try {
          const res = await axiosInstance.get(`/ratings/average/${id}`);
          set((state) => ({
            averageRatings: {
              ...state.averageRatings,
              [id]: res.data,
            },
          }));
        } catch (err) {
          console.error(`Lỗi khi fetch average rating cho ${id}`, err);
        }
      })
    );
  },

  getUserRatingForSong: (songId) => {
    const rating = get().ratings.find((r) => r.song._id === songId);
    return rating ? rating.rating : null;
  },

  getAverageRatingForSong: (songId) => {
    return get().averageRatings[songId] ?? { average: 0, totalRatings: 0 };
  },
}));
