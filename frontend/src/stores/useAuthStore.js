import { create } from "zustand";
import api from "@/lib/api";
import { debounceAsync } from "@/lib/debounce";

export const useAuthStore = create((set, get) => {
  const debouncedCheckEmailAvailability = debounceAsync(
    async (email) => {
      const normalizedEmail = String(email || "").trim().toLowerCase();

      if (!normalizedEmail) {
        return { available: null, message: "" };
      }

      try {
        const { data } = await api.get(
          `/api/auth/check-email?email=${encodeURIComponent(
            normalizedEmail
          )}`
        );
        return {
          available: Boolean(data?.available),
          message: data?.message || "Email is available",
        };
      } catch (error) {
        if (error.response?.status === 409) {
          return {
            available: false,
            message:
              error.response?.data?.message || "Email is already in use",
          };
        }

        return {
          available: null,
          message:
            error.response?.data?.message || "Failed to check email",
        };
      }
    },
    450
  );

  return {
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

    login: async (credentials) => {
      try {
        const { data } = await api.post("/api/auth/login", credentials);

        if (!data?.success) {
          throw new Error(data?.message || "Invalid credentials");
        }

        if (data?.token) {
          localStorage.setItem("authToken", data.token);
        }

        set({ authUser: data.user, isCheckingAuth: false });
        return data;
      } catch (error) {
        const message =
          error?.response?.data?.message || error?.message || "Login failed";
        throw new Error(message);
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

    checkEmailAvailability: async (email) => {
      return await debouncedCheckEmailAvailability(email);
    },
  };
});
