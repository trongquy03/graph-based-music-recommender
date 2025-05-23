import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import toast from "react-hot-toast";
import { Artist } from "@/types";

interface ArtistStore {
  artists: Artist[];
  isLoading: boolean;
  error: string | null;
  fetchArtists: () => Promise<void>;
  updateArtist: (id: string, data: Partial<Artist>) => Promise<void>;
  deleteArtist: (id: string) => Promise<void>;
}

export const useArtistStore = create<ArtistStore>((set, get) => ({
  artists: [],
  isLoading: false,
  error: null,

  fetchArtists: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.get("/artist");
      set({ artists: res.data });
    } catch (err: any) {
      toast.error("Failed to fetch artists");
      set({ error: err.message });
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
}));
