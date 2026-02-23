import { create } from "zustand";
import { toast } from "sonner";
import api from "@/lib/api";

const buildCacheKey = (page, limit) => `${page}-${limit}`;

export const useAdminUserStore = create((set, get) => ({
  users: [],
  usersByPage: {},
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPreviousPage: false,
  },
  loading: {
    users: false,
    createUser: false,
    updateUser: false,
    deleteUser: false,
    changePassword: false,
    uploadAvatar: false,
    bulkAction: false,
  },

  fetchUsers: async (page = 1, limit = 10, options = {}) => {
    const key = buildCacheKey(page, limit);
    const cached = get().usersByPage[key];

    if (cached && !options.force) {
      set({ users: cached, pagination: { ...get().pagination, currentPage: page } });
      return;
    }

    set((state) => ({ loading: { ...state.loading, users: true } }));
    try {
      const { data } = await api.get("/api/admin/users", {
        params: { page, limit },
      });

      set((state) => ({
        users: data.users || [],
        usersByPage: { ...state.usersByPage, [key]: data.users || [] },
        pagination: data.pagination || state.pagination,
      }));
    } catch (error) {
      console.error("Fetch users error:", error);
      toast.error(error.response?.data?.message || "Failed to fetch users");
    } finally {
      set((state) => ({ loading: { ...state.loading, users: false } }));
    }
  },

  createUser: async (payload) => {
    set((state) => ({ loading: { ...state.loading, createUser: true } }));
    try {
      // Verify email availability
      try {
        const { data: checkData } = await api.get(
          `/api/admin/users/check-email/${encodeURIComponent(payload.email)}`
        );
        if (checkData.available === false) {
          toast.error("Email is already in use");
          throw new Error("Email already exists");
        }
      } catch (checkError) {
        if (checkError.response?.status === 409) {
          toast.error("Email is already in use");
        }
        throw checkError;
      }

      const { data } = await api.post("/api/admin/users", payload);
      const createdUser = data.user;

      set((state) => {
        const nextCache = { ...state.usersByPage };
        const firstPageKey = buildCacheKey(1, state.pagination.itemsPerPage || 10);

        if (nextCache[firstPageKey]) {
          nextCache[firstPageKey] = [createdUser, ...nextCache[firstPageKey]];
        }

        const nextUsers = state.pagination.currentPage === 1
          ? [createdUser, ...state.users]
          : state.users;

        return {
          users: nextUsers,
          usersByPage: nextCache,
        };
      });

      toast.success("User created successfully");
      return createdUser;
    } catch (error) {
      console.error("Create user error:", error);
      toast.error(error.response?.data?.message || "Failed to create user");
      throw error;
    } finally {
      set((state) => ({ loading: { ...state.loading, createUser: false } }));
    }
  },

  updateUser: async (id, payload) => {
    set((state) => ({ loading: { ...state.loading, updateUser: true } }));
    try {
      const { data } = await api.put(`/api/admin/users/${id}`, payload);
      const updatedUser = data.user;

      set((state) => {
        const nextCache = {};
        Object.entries(state.usersByPage).forEach(([key, items]) => {
          nextCache[key] = items.map((item) =>
            item._id === id ? updatedUser : item
          );
        });

        return {
          users: state.users.map((item) =>
            item._id === id ? updatedUser : item
          ),
          usersByPage: nextCache,
        };
      });

      toast.success("User updated successfully");
      return updatedUser;
    } catch (error) {
      console.error("Update user error:", error);
      toast.error(error.response?.data?.message || "Failed to update user");
      throw error;
    } finally {
      set((state) => ({ loading: { ...state.loading, updateUser: false } }));
    }
  },

  deleteUser: async (id) => {
    set((state) => ({ loading: { ...state.loading, deleteUser: true } }));
    try {
      await api.delete(`/api/admin/users/${id}`);

      set((state) => {
        const nextCache = {};
        Object.entries(state.usersByPage).forEach(([key, items]) => {
          nextCache[key] = items.filter((item) => item._id !== id);
        });

        return {
          users: state.users.filter((item) => item._id !== id),
          usersByPage: nextCache,
        };
      });

      toast.success("User deleted successfully");
    } catch (error) {
      console.error("Delete user error:", error);
      toast.error(error.response?.data?.message || "Failed to delete user");
      throw error;
    } finally {
      set((state) => ({ loading: { ...state.loading, deleteUser: false } }));
    }
  },

  changePassword: async (id, password) => {
    set((state) => ({ loading: { ...state.loading, changePassword: true } }));
    try {
      await api.patch(`/api/admin/users/${id}/password`, { password });
      toast.success("Password updated successfully");
    } catch (error) {
      console.error("Change password error:", error);
      toast.error(error.response?.data?.message || "Failed to update password");
      throw error;
    } finally {
      set((state) => ({ loading: { ...state.loading, changePassword: false } }));
    }
  },

  uploadAvatar: async (id, file) => {
    set((state) => ({ loading: { ...state.loading, uploadAvatar: true } }));
    try {
      const formData = new FormData();
      formData.append("file", file);

      const { data } = await api.patch(`/api/admin/users/${id}/avatar`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updatedUser = data.user;
      set((state) => {
        const nextCache = {};
        Object.entries(state.usersByPage).forEach(([key, items]) => {
          nextCache[key] = items.map((item) =>
            item._id === id ? updatedUser : item
          );
        });

        return {
          users: state.users.map((item) =>
            item._id === id ? updatedUser : item
          ),
          usersByPage: nextCache,
        };
      });

      toast.success("Avatar updated successfully");
      return updatedUser;
    } catch (error) {
      console.error("Upload avatar error:", error);
      toast.error(error.response?.data?.message || "Failed to update avatar");
      throw error;
    } finally {
      set((state) => ({ loading: { ...state.loading, uploadAvatar: false } }));
    }
  },

  bulkAction: async (userIds, action) => {
    set((state) => ({ loading: { ...state.loading, bulkAction: true } }));
    try {
      const { data } = await api.post("/api/admin/users/bulk-action", {
        userIds,
        action,
      });

      // Refresh users after bulk action
      const currentPage = get().pagination.currentPage;
      const itemsPerPage = get().pagination.itemsPerPage || 10;
      await get().fetchUsers(currentPage, itemsPerPage, { force: true });

      toast.success(data.message);
      return data;
    } catch (error) {
      console.error("Bulk action error:", error);
      toast.error(error.response?.data?.message || "Failed to perform bulk action");
      throw error;
    } finally {
      set((state) => ({ loading: { ...state.loading, bulkAction: false } }));
    }
  },
}));
