import { axiosInstance } from "@/lib/axios";
import { Album, Song, Stats } from "@/types";
import toast from "react-hot-toast";
import { create } from "zustand";

const fetchLikeCount = async (songId: string): Promise<number> => {
  try {
    const response = await axiosInstance.get(`/likes/count/${songId}`);
	  // console.log(response.data)
    return response.data.likeCount;
  } catch (error) {
    console.error("Failed to fetch like count", error);
    return 0;
  }
};

interface MusicStore {
  songs: Song[];
  albums: Album[];
  page: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  currentAlbum: Album | null;
  featuredSongs: Song[];
  madeForYouSongs: Song[];
  trendingSongs: Song[];
  stats: Stats;
  likedSongIds: string[];
  hasFetchedLikes: boolean;
  likeCounts: Record<string, number>;
  listeningHistory: Song[];

  fetchAlbums: () => Promise<void>;
  fetchAlbumById: (id: string) => Promise<void>;
  fetchFeaturedSongs: () => Promise<void>;
  fetchMadeForYouSongs: () => Promise<void>;
  fetchTrendingSongs: () => Promise<void>;
  fetchLikeCountBySongId: (songId: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  deleteSong: (id: string) => Promise<void>;
  deleteAlbum: (id: string) => Promise<void>;
  fetchLikedSongs: () => Promise<void>;
  fetchListeningHistory: () => Promise<void>;
  likeSong: (songId: string) => Promise<void>;
  unlikeSong: (songId: string) => Promise<void>;
  resetLikes: () => void;
  fetchAlbumsWithPagination: (
    page?: number,
    limit?: number,
    search?: string
  ) => Promise<{ albums: Album[]; totalPages: number }>;

  fetchSongs: (
    page?: number,
    limit?: number,
    filters?: {
      search?: string;
      artist?: string;
      album?: string;
      startDate?: string;
      endDate?: string;
    }
  ) => Promise<void>;

}

export const useMusicStore = create<MusicStore>((set, get) => ({
  albums: [],
  songs: [],
  page: 1,
  totalPages: 1,
  isLoading: false,
  error: null,
  currentAlbum: null,
  madeForYouSongs: [],
  featuredSongs: [],
  trendingSongs: [],
  likedSongIds: [],
  hasFetchedLikes: false,
  likeCounts: {},
  listeningHistory: [],
  stats: {
    totalSongs: 0,
    totalAlbums: 0,
    totalUsers: 0,
    totalArtists: 0,
  },
  
  deleteSong: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.delete(`/admin/songs/${id}`);
      set((state) => ({
        songs: state.songs.filter((song) => song._id !== id),
      }));
      toast.success("Song deleted successfully");
    } catch (error: any) {
      console.log("Error in deleteSong", error);
      toast.error("Error deleting song");
    } finally {
      set({ isLoading: false });
    }
  },

 deleteAlbum: async (id) => {
  set({ isLoading: true, error: null });
  try {
    await axiosInstance.delete(`/admin/albums/${id}`);
    set((state) => ({
      albums: state.albums.filter((album) => album._id !== id),
      songs: state.songs.map((song) =>
        song.albumId === id
          ? { ...song, albumId: undefined, album: undefined }
          : song
      ),
    }));
    toast.success("Album deleted successfully");
  } catch (error: any) {
    toast.error("Failed to delete album: " + error.message);
  } finally {
    set({ isLoading: false });
  }
},


// useMusicStore.ts
fetchSongs: async (
  page = 1,
  limit = 20,
  filters: {
    search?: string;
    artist?: string;
    album?: string;
    startDate?: string;
    endDate?: string;
  } = {}
) => {
  set({ isLoading: true, error: null });

  try {
    const res = await axiosInstance.get("/songs", {
      params: {
        page,
        limit,
        ...filters, 
      },
    });

    set({
      songs: res.data.data,
      page: res.data.page,
      totalPages: res.data.totalPages,
    });
  } catch (err: any) {
    set({ error: err.message });
  } finally {
    set({ isLoading: false });
  }
},

fetchAlbumsWithPagination: async (page = 1, limit = 20, search = "") => {
  set({ isLoading: true, error: null });

  try {
    const res = await axiosInstance.get("/albums", {
      params: { page, limit, search },
    });

    return {
      albums: res.data.data || [],
      totalPages: res.data.totalPages || 1,
    };
  } catch (error: any) {
    toast.error("Failed to fetch albums");
    return {
      albums: [],
      totalPages: 1,
    };
  } finally {
    set({ isLoading: false });
  }
},


  fetchStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/stats");
      set({ stats: response.data });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAlbums: async () => {
  set({ isLoading: true, error: null });
  try {
    const response = await axiosInstance.get("/albums");
    set({ albums: response.data.data || [] });
  } catch (error: any) {
    set({ error: error.response?.data?.message || error.message });
  } finally {
    set({ isLoading: false });
  }
},


  fetchAlbumById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get(`/albums/${id}`);
      set({ currentAlbum: response.data });
    } catch (error: any) {
      set({ error: error.response?.data?.message || error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchFeaturedSongs: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/songs/featured");
      set({ featuredSongs: response.data });
    } catch (error: any) {
      set({ error: error.response?.data?.message || error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMadeForYouSongs: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/songs/made-for-you");
      set({ madeForYouSongs: response.data });
    } catch (error: any) {
      set({ error: error.response?.data?.message || error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchTrendingSongs: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/songs/trending");
      set({ trendingSongs: response.data });
    } catch (error: any) {
      set({ error: error.response?.data?.message || error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchLikedSongs: async () => {
  const { hasFetchedLikes } = get();
  if (hasFetchedLikes) return;

  set({ isLoading: true, error: null });

  try {
    const response = await axiosInstance.get("/likes");

  
    const likedIds = response.data
      .map((like: any) => like.song?._id?.toString())
      .filter(Boolean); // loại undefined/null

    set({
      likedSongIds: likedIds,
      hasFetchedLikes: true,
    });
  } catch (error: any) {
    toast.error("Failed to load liked songs");
    set({ error: error.message });
  } finally {
    set({ isLoading: false });
  }
},


fetchLikeCountBySongId: async (songId: string) => {
  try {
    const response = await axiosInstance.get(`/likes/count/${songId}`);
    const count = response.data.likeCount;
    set((state) => ({
      likeCounts: {
        ...state.likeCounts,
        [songId]: count,
      },
    }));
  } catch (err: any) {
    if (err?.response?.status !== 401) {
      console.error("Failed to fetch like count", err);
    }
  }
},

fetchListeningHistory: async () => {
  try {
    const response = await axiosInstance.get("/history");
    const songs = (response.data || []).map((entry: any) => entry.song).filter(Boolean);
    set({ listeningHistory: songs });
  } catch (error: any) {
    console.error("Error fetching history", error);
    if (error?.response?.status !== 401) {
      toast.error("Lỗi khi tải lịch sử nghe nhạc");
    }
    set({ listeningHistory: [] });
  }
},




  likeSong: async (songId) => {
    try {
      await axiosInstance.post("/likes/like", { songId });
      const likeCount = await fetchLikeCount(songId);
      set((state) => ({
        likedSongIds: [...state.likedSongIds, songId],
        likeCounts: {
          ...state.likeCounts,
          [songId]: likeCount,
        },
      }));
      toast.success("Đã thích bài hát");
    } catch (error: any) {
      toast.error("Failed to like song");
    }
  },

  unlikeSong: async (songId) => {
  try {
    await axiosInstance.post("/likes/unlike", { songId });


    await get().fetchLikedSongs();

    const likeCount = await fetchLikeCount(songId);
    set((state) => ({
      likedSongIds: state.likedSongIds.filter((id) => id !== songId),
      likeCounts: {
        ...state.likeCounts,
        [songId]: likeCount,
      },
    }));

    toast.success("Đã bỏ thích bài hát");
  } catch (error: any) {
    toast.error("Failed to unlike song");
  }
},

  resetLikes: () => {
    set({ likedSongIds: [], hasFetchedLikes: false });
  },
}));
