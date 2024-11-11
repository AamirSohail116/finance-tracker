import { create } from "zustand";

type NewTranscationType = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export const useNewTranscation = create<NewTranscationType>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));
