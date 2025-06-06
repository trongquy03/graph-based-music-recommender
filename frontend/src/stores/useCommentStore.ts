import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import toast from "react-hot-toast";

export interface Comment {
  _id: string;
  user: {
    fullName: string;
    imageUrl: string;
    clerkId: string;
  };
  song: string;
  text: string;
  parent: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CommentStore {
  comments: Comment[];
  loading: boolean;

  fetchComments: (songId: string) => Promise<void>;
  addComment: (data: { songId: string; text: string; parent?: string }) => Promise<void>;
  updateComment: (id: string, text: string) => Promise<void>;
  deleteComment: (id: string) => Promise<void>;
}

export const useCommentStore = create<CommentStore>((set, get) => ({
  comments: [],
  loading: false,

  fetchComments: async (songId) => {
    try {
      set({ loading: true });
      const res = await axiosInstance.get(`/comments/song/${songId}`);
      set({ comments: res.data });
    } catch (err) {
      toast.error("Không thể tải bình luận");
    } finally {
      set({ loading: false });
    }
  },

  addComment: async ({ songId, text, parent }) => {
    try {
      const res = await axiosInstance.post("/comments", { songId, text, parent });
      set({ comments: [res.data, ...get().comments] });
    } catch (err) {
      toast.error("Không thể thêm bình luận");
    }
  },

  updateComment: async (id, text) => {
    try {
      const res = await axiosInstance.put(`/comments/${id}`, { text });
      const updated = res.data;
      set({
        comments: get().comments.map((c) =>
          c._id === id ? { ...c, text: updated.text, updatedAt: updated.updatedAt } : c
        ),
      });
    } catch (err) {
      toast.error("Không thể cập nhật bình luận");
    }
  },

  deleteComment: async (id) => {
    try {
      await axiosInstance.delete(`/comments/${id}`);
      set({ comments: get().comments.filter((c) => c._id !== id) });
    } catch (err) {
      toast.error("Không thể xoá bình luận");
    }
  },
}));
