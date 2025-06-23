import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import { Artist, Song } from "@/types";

interface RecommendedArtist extends Artist {
  similarity: number | null;
  score: number | null;
}

interface RecommendedSong extends Song {
  similarity: number | null;
  score: number | null;
}

interface UserRecommenderStore {
  recommendedArtists: RecommendedArtist[];
  recommendedSongs: RecommendedSong[];
  isLoading: boolean;
  error: string | null;

  fetchRecommendedArtists: () => Promise<void>;
  fetchSimilarArtists: (artistId: string) => Promise<RecommendedArtist[]>;
  fetchRecommendedSongs: () => Promise<void>;  // 👈 dùng PageRank
  fetchSimilarSongs: (songId: string) => Promise<RecommendedSong[]>; // 👈 dùng nodeSimilarity
}

export const useUserRecommenderStore = create<UserRecommenderStore>((set) => ({
  recommendedArtists: [],
  recommendedSongs: [],
  isLoading: false,
  error: null,

  fetchRecommendedArtists: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.get("/artist/recommendations");
      const sorted = [...res.data.data].sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0));
      set({ recommendedArtists: sorted });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSimilarArtists: async (artistId) => {
    try {
      const res = await axiosInstance.get(`/artist/${artistId}/similar`);
      return [...res.data.data].sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0));
    } catch (err: any) {
      return [];
    }
  },

  //  Gợi ý cá nhân hóa (PageRank)
fetchRecommendedSongs: async () => {
  set({ isLoading: true, error: null });
  try {
    const res = await axiosInstance.get("/songs/recommend"); 
    const data = res.data;

    // Lấy danh sách bài hát đã enrich từ MongoDB
    const songs = data.songs.map((song: any) => ({
      ...song,
      similarity: null, // vì không trả từ API
      score: null,      // vì cũng không dùng PageRank gốc từ Neo4j
    }));

    set({ recommendedSongs: songs });
  } catch (err: any) {
    set({ error: err.message });
  } finally {
    set({ isLoading: false });
  }
},


  // Bài hát tương tự 1 bài cụ thể (nodeSimilarity)
  fetchSimilarSongs: async (songId) => {
    try {
      const res = await axiosInstance.get(`/songs/${songId}/similar`);
      return [...res.data].sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0));
    } catch (err: any) {
      return [];
    }
  },
}));

export type { RecommendedArtist, RecommendedSong };
