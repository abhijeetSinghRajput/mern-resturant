import { create } from "zustand";
import { toast } from "sonner";
import api from "@/lib/api";

export const useImageStore = create((set, get) => {
  const store = {
    galleryImages: [],
    isLoadingImages: false,

    getImages: async () => {
      set({ isLoadingImages: true });
      try {
        const res = await api.get("/api/images");
        const { images: galleryImages } = res.data;
        set({ galleryImages });
      } catch (error) {
        console.error(error);
        throw new Error("error");
      } finally {
        set({ isLoadingImages: false });
      }
    },

    uploadImage: async (file) => {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await api.post("/api/images/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        const { image, message } = res.data;
        set({ galleryImages: [image, ...get().galleryImages] });
        localStorage.setItem("imageCount", get().galleryImages.length);
        toast.success(message);
        return true;
      } catch (error) {
        console.error("Image upload error:\n", error);
        toast.error("Failed to upload image");
        return false;
      }
    },

    removeImage: async (imageId) => {
      try {
        const res = await api.delete(`/api/images/${imageId}`);
        const { message } = res.data;
        set((state) => ({
          galleryImages: state.galleryImages.filter(
            (img) => img._id !== imageId
          ),
        }));
        localStorage.setItem("imageCount", get().galleryImages.length);
        toast.success(message);
        return true;
      } catch (error) {
        console.error("Image delete error:\n", error);
        toast.error(error.response?.data?.message || "Failed to delete image");
        return false;
      }
    },
  };
  return {
    ...store,
  };
});
