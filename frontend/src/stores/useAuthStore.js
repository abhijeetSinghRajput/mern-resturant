import { create } from "zustand";
import api from "@/lib/api";

export const useAuthStore = create((set) => ({
    authUser: null,
    isCheckingAuth: true,

    checkAuth: async () => {
        set({ isCheckingAuth: true });

        try {
            const { data } = await api.get("/api/auth/me");
            if (!data.success) {
                set({ authUser: null, isCheckingAuth: false });
                return;
            }

            set({ authUser: data.user, isCheckingAuth: false });
        } catch {
            set({ authUser: null, isCheckingAuth: false });
        }
    },

        logout: async () => {
            try {
                await api.post("/api/auth/logout");
            } catch {
            } finally {
                localStorage.removeItem("authToken");
                set({ authUser: null });
            }
        },
}))