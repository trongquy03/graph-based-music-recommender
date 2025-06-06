import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";

interface PremiumState {
  isPremium: boolean;
  subscriptionType: string;
  premiumUntil?: string;
  loading: boolean;
  fetchPremiumStatus: () => Promise<void>;
}

export const usePremiumStore = create<PremiumState>((set) => ({
  isPremium: false,
  subscriptionType: "free",
  premiumUntil: undefined,
  loading: false,

  fetchPremiumStatus: async () => {
    try {
      set({ loading: true });

      const res = await axiosInstance.get("/users/me/premium-status");
      const { isPremium, subscriptionType, premiumUntil } = res.data;

      set({
        isPremium: !!isPremium,
        subscriptionType: subscriptionType || "free",
        premiumUntil: premiumUntil || undefined,
        loading: false,
      });
    } catch (err) {
      console.error("Lỗi lấy trạng thái Premium:", err);
      set({
        isPremium: false,
        subscriptionType: "free",
        premiumUntil: undefined,
        loading: false,
      });
    }
  },
}));
