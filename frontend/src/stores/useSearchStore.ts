import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import { Song, Album, Artist } from "@/types";

interface SearchStore {
  query: string;
  results: {
    songs: Song[];
    albums: Album[];
    artists: Artist[];
  };
  loading: boolean;
  setQuery: (q: string) => void;
  clear: () => void;
  search: (q: string) => Promise<void>;
}

export const useSearchStore = create<SearchStore>((set) => ({
  query: "",
  results: { songs: [], albums: [], artists: [] },
  loading: false,

  setQuery: (q) => set({ query: q }),

  clear: () => set({ results: { songs: [], albums: [], artists: [] }, query: "" }),

  search: async (q) => {
    if (!q || q.trim() === "") return;

    set({ loading: true });

    try {
      const res = await axiosInstance.get("/search?", {
        params: { q },
      });

      set({ results: res.data });
    } catch (err) {
      console.error("Search API error:", err);
    } finally {
      set({ loading: false });
    }
  },
}));
