import { create } from "zustand";
import { toast } from "sonner";
import api from "@/lib/api";

export const useFoodStore = create((set, get) => ({
  categories: [],
  foodItems: [],
  foodItemsByCategory: {},
  activeFoodCategoryId: null,
  loading: {
    categories: false,
    foodItems: false,
    createCategory: false,
    updateCategory: false,
    deleteCategory: false,
    createFoodItem: false,
    updateFoodItem: false,
    deleteFoodItem: false,
    uploadImage: false,
    uploadCategoryImage: false,
  },

  // Fetch all categories
  fetchCategories: async (options = {}) => {
    if (get().categories.length > 0 && !options.force) {
      return;
    }
    set((state) => ({ loading: { ...state.loading, categories: true } }));
    try {
      const { data } = await api.get("/api/categories");
      set({ categories: data.categories || [] });
    } catch (error) {
      console.error("Fetch categories error:", error);
      toast.error(error.response?.data?.message || "Failed to fetch categories");
    } finally {
      set((state) => ({ loading: { ...state.loading, categories: false } }));
    }
  },

  // Create new category
  createCategory: async (categoryData) => {
    set((state) => ({ loading: { ...state.loading, createCategory: true } }));
    try {
      const { data } = await api.post("/api/categories", categoryData);
      set((state) => ({
        categories: [data.category, ...state.categories],
      }));
      toast.success("Category created successfully");
      return data.category;
    } catch (error) {
      console.error("Create category error:", error);
      toast.error(error.response?.data?.message || "Failed to create category");
      throw error;
    } finally {
      set((state) => ({ loading: { ...state.loading, createCategory: false } }));
    }
  },

  // Update category
  updateCategory: async (id, categoryData) => {
    set((state) => ({ loading: { ...state.loading, updateCategory: true } }));
    try {
      const { data } = await api.put(`/api/categories/${id}`, categoryData);
      set((state) => ({
        categories: state.categories.map((cat) =>
          cat._id === id ? data.category : cat
        ),
      }));
      toast.success("Category updated successfully");
      return data.category;
    } catch (error) {
      console.error("Update category error:", error);
      toast.error(error.response?.data?.message || "Failed to update category");
      throw error;
    } finally {
      set((state) => ({ loading: { ...state.loading, updateCategory: false } }));
    }
  },

  // Delete category
  deleteCategory: async (id) => {
    set((state) => ({ loading: { ...state.loading, deleteCategory: true } }));
    try {
      await api.delete(`/api/categories/${id}`);
      set((state) => ({
        categories: state.categories.filter((cat) => cat._id !== id),
      }));
      toast.success("Category deleted successfully");
    } catch (error) {
      console.error("Delete category error:", error);
      toast.error(error.response?.data?.message || "Failed to delete category");
      throw error;
    } finally {
      set((state) => ({ loading: { ...state.loading, deleteCategory: false } }));
    }
  },

  fetchFoodItems: async (categoryId, options = {}) => {
    const cacheKey = categoryId || "__all__";
    const cachedItems = get().foodItemsByCategory[cacheKey];

    if (cachedItems && !options.force) {
      set({ foodItems: cachedItems, activeFoodCategoryId: categoryId || null });
      return;
    }

    set((state) => ({ loading: { ...state.loading, foodItems: true } }));
    try {
      const params = categoryId ? { categoryId } : undefined;
      const { data } = await api.get("/api/food-items", { params });
      const items = data.foodItems || [];
      set((state) => ({
        foodItems: items,
        activeFoodCategoryId: categoryId || null,
        foodItemsByCategory: {
          ...state.foodItemsByCategory,
          [cacheKey]: items,
        },
      }));
    } catch (error) {
      console.error("Fetch food items error:", error);
      toast.error(error.response?.data?.message || "Failed to fetch food items");
    } finally {
      set((state) => ({ loading: { ...state.loading, foodItems: false } }));
    }
  },

  createFoodItem: async (foodItemData) => {
    set((state) => ({ loading: { ...state.loading, createFoodItem: true } }));
    try {
      const { data } = await api.post("/api/food-items", foodItemData);
      const createdItem = data.foodItem;
      const createdCategoryId =
        typeof createdItem.categoryId === "string"
          ? createdItem.categoryId
          : createdItem.categoryId?._id;

      set((state) => {
        const nextCache = { ...state.foodItemsByCategory };
        const allKey = "__all__";

        const nextAll = nextCache[allKey]
          ? [createdItem, ...nextCache[allKey].filter((item) => item._id !== createdItem._id)]
          : [createdItem];
        nextCache[allKey] = nextAll;

        if (createdCategoryId) {
          const categoryItems = nextCache[createdCategoryId];
          if (categoryItems) {
            nextCache[createdCategoryId] = [
              createdItem,
              ...categoryItems.filter((item) => item._id !== createdItem._id),
            ];
          }
        }

        let nextFoodItems = state.foodItems;
        if (!state.activeFoodCategoryId) {
          nextFoodItems = nextAll;
        } else if (state.activeFoodCategoryId === createdCategoryId) {
          nextFoodItems = nextCache[createdCategoryId] || [createdItem, ...state.foodItems];
        }

        return {
          foodItems: nextFoodItems,
          foodItemsByCategory: nextCache,
        };
      });
      toast.success("Food item created successfully");
      return data.foodItem;
    } catch (error) {
      console.error("Create food item error:", error);
      toast.error(error.response?.data?.message || "Failed to create food item");
      throw error;
    } finally {
      set((state) => ({ loading: { ...state.loading, createFoodItem: false } }));
    }
  },

  updateFoodItem: async (id, foodItemData) => {
    set((state) => ({ loading: { ...state.loading, updateFoodItem: true } }));
    try {
      const { data } = await api.put(`/api/food-items/${id}`, foodItemData);
      const updatedItem = data.foodItem;
      const updatedCategoryId =
        typeof updatedItem.categoryId === "string"
          ? updatedItem.categoryId
          : updatedItem.categoryId?._id;

      set((state) => {
        const nextCache = {};

        Object.entries(state.foodItemsByCategory).forEach(([key, items]) => {
          if (key === "__all__") {
            nextCache[key] = items.map((item) =>
              item._id === id ? updatedItem : item
            );
            return;
          }

          if (key === updatedCategoryId) {
            const exists = items.some((item) => item._id === id);
            nextCache[key] = exists
              ? items.map((item) => (item._id === id ? updatedItem : item))
              : [updatedItem, ...items];
            return;
          }

          nextCache[key] = items.filter((item) => item._id !== id);
        });

        let nextFoodItems = state.foodItems.map((item) =>
          item._id === id ? updatedItem : item
        );

        if (!state.activeFoodCategoryId) {
          nextFoodItems = nextCache.__all__ || nextFoodItems;
        } else if (state.activeFoodCategoryId === updatedCategoryId) {
          nextFoodItems = nextCache[updatedCategoryId] || nextFoodItems;
        } else {
          nextFoodItems = nextFoodItems.filter((item) => item._id !== id);
        }

        return {
          foodItems: nextFoodItems,
          foodItemsByCategory: nextCache,
        };
      });
      toast.success("Food item updated successfully");
      return data.foodItem;
    } catch (error) {
      console.error("Update food item error:", error);
      toast.error(error.response?.data?.message || "Failed to update food item");
      throw error;
    } finally {
      set((state) => ({ loading: { ...state.loading, updateFoodItem: false } }));
    }
  },

  deleteFoodItem: async (id) => {
    set((state) => ({ loading: { ...state.loading, deleteFoodItem: true } }));
    try {
      await api.delete(`/api/food-items/${id}`);
      set((state) => {
        const nextCache = {};

        Object.entries(state.foodItemsByCategory).forEach(([key, items]) => {
          nextCache[key] = items.filter((item) => item._id !== id);
        });

        return {
          foodItems: state.foodItems.filter((item) => item._id !== id),
          foodItemsByCategory: nextCache,
        };
      });
      toast.success("Food item deleted successfully");
    } catch (error) {
      console.error("Delete food item error:", error);
      toast.error(error.response?.data?.message || "Failed to delete food item");
      throw error;
    } finally {
      set((state) => ({ loading: { ...state.loading, deleteFoodItem: false } }));
    }
  },

  // Upload general image
  uploadImage: async (file) => {
    set((state) => ({ loading: { ...state.loading, uploadImage: true } }));
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const { data } = await api.post("/api/images/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      toast.success("Image uploaded successfully");
      return data.image;
    } catch (error) {
      console.error("Upload image error:", error);
      toast.error(error.response?.data?.message || "Failed to upload image");
      throw error;
    } finally {
      set((state) => ({ loading: { ...state.loading, uploadImage: false } }));
    }
  },

  // Upload category-specific image
  uploadCategoryImage: async (categoryId, file) => {
    set((state) => ({ loading: { ...state.loading, uploadCategoryImage: true } }));
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const { data } = await api.post(`/api/categories/${categoryId}/upload-image`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      // Update the category in state with new image
      set((state) => ({
        categories: state.categories.map((cat) =>
          cat._id === categoryId ? { ...cat, image: data.image } : cat
        ),
      }));
      
      toast.success("Category image uploaded successfully");
      return data.image;
    } catch (error) {
      console.error("Upload category image error:", error);
      toast.error(error.response?.data?.message || "Failed to upload category image");
      throw error;
    } finally {
      set((state) => ({ loading: { ...state.loading, uploadCategoryImage: false } }));
    }
  },
}));
