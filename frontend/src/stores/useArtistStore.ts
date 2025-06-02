import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import toast from "react-hot-toast";
import { Artist, Song, Album } from "@/types";

interface ArtistWithFollowInfo extends Artist {
  isFollowing?: boolean;
  followersCount?: number;
  topSongs?: Song[];
  topAlbums?: Album[];
}

interface ArtistStore {
  artists: ArtistWithFollowInfo[];

  isLoading: boolean;
  error: string | null;

  fetchArtists: (
  page?: number,
  limit?: number,
  search?: string,
  isSignedIn?: boolean
) => Promise<{ artists: Artist[]; totalPages: number }>;


  updateArtist: (id: string, data: Partial<Artist>) => Promise<void>;
  deleteArtist: (id: string) => Promise<void>;

  followArtist: (artistId: string) => Promise<void>;
  unfollowArtist: (artistId: string) => Promise<void>;
  isFollowing: (artistId: string) => Promise<boolean>;
  fetchFollowedArtists: () => Promise<Artist[]>;
  fetchFollowersCount: (artistId: string) => Promise<number>;
}

export const useArtistStore = create<ArtistStore>((set, get) => ({
  artists: [],
  isLoading: false,
  error: null,

fetchArtists: async (page = 1, limit = 20, search = "", isSignedIn = false) => {
  set({ isLoading: true, error: null });
  try {
    const res = await axiosInstance.get("/artist", {
      params: { page, limit, search },
    });

    const rawArtists = res.data.data || [];
    const totalPages = res.data.totalPages || 1;

    const enrichedArtists = await Promise.all(
      rawArtists.map(async (artist: Artist) => {
        let isFollowingRes = false;
        if (isSignedIn) {
          try {
            isFollowingRes = await get().isFollowing(artist._id);
          } catch {
            isFollowingRes = false;
          }
        }

        const followersCountRes = await get().fetchFollowersCount(artist._id);
        return {
          ...artist,
          isFollowing: isFollowingRes,
          followersCount: followersCountRes,
        };
      })
    );

    set({ artists: enrichedArtists });
    return { artists: enrichedArtists, totalPages }; // ✅ Thêm return ở đây
  } catch (err: any) {
    toast.error("Failed to fetch artists");
    set({ error: err.message });
    return { artists: [], totalPages: 1 }; // ✅ Trả fallback để không bị crash
  } finally {
    set({ isLoading: false });
  }
},




  updateArtist: async (id, data) => {
    try {
      const res = await axiosInstance.put(`admin/artists/${id}`, data);
      set((state) => ({
        artists: state.artists.map((artist) =>
          artist._id === id ? res.data : artist
        ),
      }));
      toast.success("Artist updated successfully");
    } catch (err: any) {
      toast.error("Failed to update artist: " + err.message);
    }
  },

  deleteArtist: async (id) => {
    try {
      await axiosInstance.delete(`admin/artists/${id}`);
      set((state) => ({
        artists: state.artists.filter((artist) => artist._id !== id),
      }));
      toast.success("Artist deleted successfully");
    } catch (err: any) {
      toast.error("Failed to delete artist: " + err.message);
    }
  },

  followArtist: async (artistId) => {
    try {
      await axiosInstance.post(`/artist/${artistId}/follow`);
      set((state) => ({
        artists: state.artists.map((a) =>
          a._id === artistId
            ? {
                ...a,
                isFollowing: true,
                followersCount: (a.followersCount ?? 0) + 1,
              }
            : a
        ),
      }));
      toast.success("Followed artist");
    } catch (err: any) {
      toast.error("Failed to follow: " + err.message);
    }
  },

  unfollowArtist: async (artistId) => {
    try {
      await axiosInstance.post(`/artist/${artistId}/unfollow`);
      set((state) => ({
        artists: state.artists.map((a) =>
          a._id === artistId
            ? {
                ...a,
                isFollowing: false,
                followersCount: Math.max(0, (a.followersCount ?? 1) - 1),
              }
            : a
        ),
      }));
      toast.success("Unfollowed artist");
    } catch (err: any) {
      toast.error("Failed to unfollow: " + err.message);
    }
  },

  isFollowing: async (artistId) => {
    try {
      const res = await axiosInstance.get(`/artist/${artistId}/is-following`);
      return res.data.isFollowing;
    } catch (err: any) {
      return false; // Silent fallback
    }
  },

  fetchFollowedArtists: async () => {
    try {
      const res = await axiosInstance.get(`/artist/me/following`);
      return res.data.artists as Artist[];
    } catch (err: any) {
      toast.error("Failed to fetch followed artists");
      return [];
    }
  },

  fetchFollowersCount: async (artistId) => {
    try {
      const res = await axiosInstance.get(`/artist/${artistId}/followers/count`);
      return res.data.followers;
    } catch (err: any) {
      console.error("Failed to fetch followers count:", err);
      return 0;
    }
  },
}));
