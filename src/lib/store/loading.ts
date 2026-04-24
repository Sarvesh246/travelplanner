import { create } from 'zustand';

interface LoadingStore {
  isLoading: boolean;
  message?: string;
  setLoading: (loading: boolean, message?: string) => void;
  startLoading: (message?: string) => void;
  stopLoading: () => void;
}

export const useLoadingStore = create<LoadingStore>((set) => ({
  isLoading: false,
  message: undefined,
  setLoading: (loading, message) => set({ isLoading: loading, message }),
  startLoading: (message) => set({ isLoading: true, message }),
  stopLoading: () => set({ isLoading: false, message: undefined }),
}));
