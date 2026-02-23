import { create } from "zustand";

export const useEditorStore = create((set) => ({
  openImageDialog: false,
  
  openDialog: (dialogName) => {
    set({ [dialogName]: true });
  },
  
  closeDialog: (dialogName) => {
    set({ [dialogName]: false });
  },
}));
