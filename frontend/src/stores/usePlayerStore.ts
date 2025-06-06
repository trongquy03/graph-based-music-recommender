import { create } from "zustand";
import { Song } from "@/types";
import { useChatStore } from "./useChatStore";

interface PlayerStore {
  currentSong: Song | null;
  isPlaying: boolean;
  queue: Song[];
  currentIndex: number;
  isLooping: boolean;
  isShuffling: boolean;
  isPlayingAd: boolean;
  setIsPlayingAd: (value: boolean) => void;

  initializeQueue: (songs: Song[]) => void;
  playAlbum: (songs: Song[], startIndex?: number) => void;
  setCurrentSong: (song: Song | null) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  toggleLoop: () => void;
  shuffleQueue: () => void;
  setAdPlaying: (val: boolean) => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentSong: null,
  isPlaying: false,
  queue: [],
  currentIndex: -1,
  isLooping: false,
  isShuffling: false,
  isPlayingAd: false,
  setIsPlayingAd: (value) => set({ isPlayingAd: value }),

  initializeQueue: (songs) => {
    set({
      queue: songs,
      currentSong: songs[0] || null,
      currentIndex: songs.length > 0 ? 0 : -1,
    });
  },

  playAlbum: (songs, startIndex = 0) => {
    if (!songs.length) return;

    const song = songs[startIndex];
    const socket = useChatStore.getState().socket;
    if (socket?.auth?.userId) {
      socket.emit("update_activity", {
        userId: socket.auth.userId,
        activity: `Playing ${song.title} by ${song.artist}`,
      });
    }

    set({
      queue: songs,
      currentSong: song,
      currentIndex: startIndex,
      isPlaying: true,
    });
  },

  setCurrentSong: (song) => {
    if (!song) return;

    const songIndex = get().queue.findIndex((s) => s._id === song._id);
    const socket = useChatStore.getState().socket;
    if (socket?.auth?.userId) {
      socket.emit("update_activity", {
        userId: socket.auth.userId,
        activity: `Playing ${song.title} by ${song.artist}`,
      });
    }

    set({
      currentSong: song,
      isPlaying: true,
      currentIndex: songIndex !== -1 ? songIndex : 0,
    });
  },

  togglePlay: () => {
    const { isPlaying, currentSong } = get();
    const socket = useChatStore.getState().socket;
    if (socket?.auth?.userId) {
      socket.emit("update_activity", {
        userId: socket.auth.userId,
        activity: !isPlaying && currentSong
          ? `Playing ${currentSong.title} by ${currentSong.artist}`
          : "Idle",
      });
    }

    set({ isPlaying: !isPlaying });
  },

  playNext: () => {
    const { queue, currentIndex, isShuffling } = get();

    if (!queue.length) return;

    let nextIndex = currentIndex + 1;

    if (isShuffling) {
      nextIndex = Math.floor(Math.random() * queue.length);
    }

    if (nextIndex < queue.length) {
      const nextSong = queue[nextIndex];
      const socket = useChatStore.getState().socket;
      if (socket?.auth?.userId) {
        socket.emit("update_activity", {
          userId: socket.auth.userId,
          activity: `Playing ${nextSong.title} by ${nextSong.artist}`,
        });
      }

      set({
        currentIndex: nextIndex,
        currentSong: nextSong,
        isPlaying: true,
      });
    } else {
      // Loop playlist về đầu
      const song = queue[0];
      const socket = useChatStore.getState().socket;
      if (socket?.auth?.userId) {
        socket.emit("update_activity", {
          userId: socket.auth.userId,
          activity: `Playing ${song.title} by ${song.artist}`,
        });
      }

      set({
        currentIndex: 0,
        currentSong: song,
        isPlaying: true,
      });
    }
  },

  playPrevious: () => {
    const { queue, currentIndex } = get();
    const prevIndex = currentIndex - 1;

    if (prevIndex >= 0) {
      set({
        currentIndex: prevIndex,
        currentSong: queue[prevIndex],
        isPlaying: true,
      });
    } else {
      set({
        currentIndex: 0,
        currentSong: queue[0],
        isPlaying: true,
      });
    }
  },

  toggleLoop: () => set({ isLooping: !get().isLooping }),

  shuffleQueue: () => set({ isShuffling: !get().isShuffling }),

  setAdPlaying: (val) => set({ isPlayingAd: val }),
}));
