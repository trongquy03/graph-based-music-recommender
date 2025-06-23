
import { create } from "zustand";
import { Song } from "@/types";
import { useChatStore } from "./useChatStore";
import { ytPlayerRef } from "@/lib/youtubePlayer";
import { axiosInstance } from "@/lib/axios";

interface PlayerStore {
  currentSong: Song | null;
  isPlaying: boolean;
  queue: Song[];
  currentIndex: number;
  isLooping: boolean;
  isShuffling: boolean;
  isPlayingAd: boolean;
  setIsPlaying: (value: boolean) => void;
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

const recordListening = async (songId: string) => {
  try {
    await axiosInstance.post("/history", { songId });
  } catch (err) {
    console.error("Không thể ghi lịch sử nghe:", err);
  }
};


export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentSong: null,
  isPlaying: false,
  queue: [],
  currentIndex: -1,
  isLooping: false,
  isShuffling: false,
  isPlayingAd: false,

  setIsPlaying: (value) => set({ isPlaying: value }),
  setIsPlayingAd: (value) => set({ isPlayingAd: value }),

  initializeQueue: (songs) => {
    set({
      queue: songs,
      currentSong: null,
      currentIndex: -1,
    });
  },

  playAlbum: (songs, startIndex = 0) => {
    if (!songs.length) return;

    set({
      queue: songs,
      currentIndex: startIndex,
    });

    get().setCurrentSong(songs[startIndex]);
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
      currentIndex: songIndex !== -1 ? songIndex : 0,
      isPlaying: true,
    });

    recordListening(song._id);

    setTimeout(() => {
      const audio = document.querySelector("audio") as HTMLAudioElement;

      if (song.audioUrl) {
        if (audio) {
          audio.src = song.audioUrl;
          audio.load();
          audio.play().catch((err) => console.error("Audio play error:", err));
        }
      } else {
        if (audio) {
          audio.pause();
          audio.removeAttribute("src");
          audio.load();
        }

        ytPlayerRef.current?.loadVideoById?.(song.youtubeUrl.split("v=")[1]);
        ytPlayerRef.current?.playVideo?.();
      }
    }, 300);
  },

  togglePlay: () => {
    const { isPlaying, currentSong } = get();
    if (!currentSong) return;

    const audio = document.querySelector("audio") as HTMLAudioElement;

    if (currentSong.audioUrl && audio) {
      isPlaying ? audio.pause() : audio.play();
    } else if (!currentSong.audioUrl) {
      if (ytPlayerRef.current?.playVideo && ytPlayerRef.current?.pauseVideo) {
        isPlaying ? ytPlayerRef.current.pauseVideo() : ytPlayerRef.current.playVideo();
      }
    }

    set({ isPlaying: !isPlaying });
  },

  playNext: () => {
    const { queue, currentIndex, isShuffling, setCurrentSong } = get();
    if (!queue.length) return;

    let nextIndex = currentIndex + 1;
    if (isShuffling) {
      nextIndex = Math.floor(Math.random() * queue.length);
    }

    if (nextIndex >= queue.length) nextIndex = 0;
    setCurrentSong(queue[nextIndex]);
  },

  playPrevious: () => {
    const { queue, currentIndex, setCurrentSong } = get();
    let prevIndex = currentIndex - 1;

    if (prevIndex < 0) prevIndex = 0;
    setCurrentSong(queue[prevIndex]);
  },

  toggleLoop: () => set({ isLooping: !get().isLooping }),
  shuffleQueue: () => set({ isShuffling: !get().isShuffling }),
  setAdPlaying: (val) => set({ isPlayingAd: val }),
}));