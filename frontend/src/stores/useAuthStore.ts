import { axiosInstance } from "@/lib/axios";
import { create } from "zustand";

interface AuthStore {
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;

  checkAdminStatus: () => Promise<void>;
  reset: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAdmin: false,
  isLoading: false,
  error: null,

  checkAdminStatus: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/admin/check");
      set({
        isAdmin: response.data?.admin ?? true, // fallback true nếu không rõ
      });
    } catch (error: any) {
      if (error?.response?.status === 403) {
        set({ isAdmin: false });
      } else {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Lỗi không xác định";
        set({ isAdmin: false, error: message });
        console.error("Lỗi checkAdminStatus:", message);
      }
    } finally {
      set({ isLoading: false });
    }
  },

  reset: () => set({ isAdmin: false, isLoading: false, error: null }),
}));
