import { create } from "zustand";
import { Playlist, Song } from "@/types";
import { axiosInstance } from "@/lib/axios";

interface PlaylistStore {
  playlists: Playlist[];
  currentPlaylist: Playlist | null;
  isLoading: boolean;
  fetchPlaylists: () => Promise<void>;
  setCurrentPlaylist: (playlist: Playlist | null) => void;
  createPlaylist: (data: { name: string; isPublic: boolean; songIds?: string[] }) => Promise<void>;
  addSongToPlaylist: (playlistId: string, songId: string) => Promise<void>;
  removeSongFromPlaylist: (playlistId: string, songId: string) => Promise<void>;
  reorderPlaylist: (playlistId: string, songIds: string[]) => Promise<void>;
  updatePlaylist: (playlistId: string, updates: { name?: string; isPublic?: boolean }) => Promise<void>;
  fetchPlaylistById: (playlistId: string) => Promise<Playlist | null>;
}

export const usePlaylistStore = create<PlaylistStore>((set, get) => ({
  playlists: [],
  currentPlaylist: null,
  isLoading: false,

  fetchPlaylists: async () => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get("/playlists");
      set({ playlists: res.data, isLoading: false });
    } catch (err) {
      console.error("Lỗi khi tải playlists:", err);
      set({ isLoading: false });
    }
  },

  setCurrentPlaylist: (playlist) => set({ currentPlaylist: playlist }),

createPlaylist: async ({ name, isPublic, songIds }) => {
  try {
    await axiosInstance.post("/playlists", {
      name,
      isPublic,
      songs: songIds ?? [], // ✅ bảo đảm là mảng rỗng nếu undefined
    });
    get().fetchPlaylists(); // Gợi ý: gọi lại để cập nhật
  } catch (err) {
    console.error("Không thể tạo playlist:", err);
  }
},



  addSongToPlaylist: async (playlistId, songId) => {
    try {
      const res = await axiosInstance.post("/playlists/add-song", { playlistId, songId });
      set((state) => ({
        playlists: state.playlists.map(p => p._id === playlistId ? res.data : p),
        currentPlaylist: get().currentPlaylist?._id === playlistId ? res.data : get().currentPlaylist,
      }));
    } catch (err) {
      console.error("Không thể thêm bài hát:", err);
    }
  },

  removeSongFromPlaylist: async (playlistId, songId) => {
    try {
      const res = await axiosInstance.post("/playlists/remove-song", { playlistId, songId });
      set((state) => ({
        playlists: state.playlists.map(p => p._id === playlistId ? res.data : p),
        currentPlaylist: get().currentPlaylist?._id === playlistId ? res.data : get().currentPlaylist,
      }));
    } catch (err) {
      console.error("Không thể xoá bài hát:", err);
    }
  },

  reorderPlaylist: async (playlistId, songIds) => {
    try {
      const res = await axiosInstance.post("/playlists/reorder", {
        playlistId,
        newOrder: songIds,
      });
      set((state) => ({
        playlists: state.playlists.map(p => p._id === playlistId ? res.data : p),
        currentPlaylist: get().currentPlaylist?._id === playlistId ? res.data : get().currentPlaylist,
      }));
    } catch (err) {
      console.error("Không thể sắp xếp playlist:", err);
    }
  },

  updatePlaylist: async (playlistId, updates) => {
    try {
      const res = await axiosInstance.put(`/playlists/${playlistId}`, updates);
      set((state) => ({
        playlists: state.playlists.map(p => p._id === playlistId ? res.data : p),
        currentPlaylist: get().currentPlaylist?._id === playlistId ? res.data : get().currentPlaylist,
      }));
    } catch (err) {
      console.error("Không thể cập nhật playlist:", err);
    }
  },

  fetchPlaylistById: async (playlistId) => {
    try {
      const res = await axiosInstance.get(`/playlists/${playlistId}`);
      return res.data;
    } catch (err) {
      console.error("Không thể tải playlist:", err);
      return null;
    }
  },
}));
