import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import { Song, Album, Artist } from "@/types";

// Tạo kiểu dùng chung
export interface SearchResults {
  songs: Song[];
  albums: Album[];
  artists: Artist[];
}

interface SearchStore {
  query: string;
  results: SearchResults;
  loading: boolean;
  setQuery: (q: string) => void;
  clear: () => void;
  search: (q: string) => Promise<void>;
  searchTemp: (q: string) => Promise<SearchResults>;
}

export const useSearchStore = create<SearchStore>((set) => ({
  query: "",
  results: { songs: [], albums: [], artists: [] },
  loading: false,

  setQuery: (q) => set({ query: q }),

  clear: () => set({
    results: { songs: [], albums: [], artists: [] },
    query: ""
  }),

search: async (
  q: string,
  tags?: string[],
  songOffset: number = 0,
  albumOffset: number = 0,
  artistOffset: number = 0,
  tab?: string,
  page: number = 1
) => {
  if (!q.trim()) return;
  set({ loading: true });

  try {
    const res = await axiosInstance.get("/search", {
      params: {
        q,
        tags,
        songOffset,
        albumOffset,
        artistOffset,
        tab,
      },
    });

    set((prev) => ({
      results: {
        songs:
          page === 1
            ? res.data.songs
            : [...prev.results.songs, ...res.data.songs],
        albums:
          page === 1
            ? res.data.albums
            : [...prev.results.albums, ...res.data.albums],
        artists:
          page === 1
            ? res.data.artists
            : [...prev.results.artists, ...res.data.artists],
      },
    }));
  } catch (error) {
    console.error("Search error:", error);
  } finally {
    set({ loading: false });
  }
},



  searchTemp: async (q) => {
    if (!q || q.trim() === "") return { songs: [], albums: [], artists: [] };

    try {
      const res = await axiosInstance.get("/search", {
        params: { q },
      });
      return res.data as SearchResults;
    } catch (err) {
      console.error("SearchTemp API error:", err);
      return { songs: [], albums: [], artists: [] };
    }
  },
}));
