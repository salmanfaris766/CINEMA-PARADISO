import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CompareItem {
  id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string;
}

export interface CompareState {
  items: CompareItem[];
  addItem: (item: CompareItem) => void;
  removeItem: (id: number) => void;
  clearAll: () => void;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const alreadyExists = state.items.some((i) => i.id === item.id);
          if (alreadyExists || state.items.length >= 4) {
            return state;
          }
          return { items: [...state.items, item] };
        }),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),
      clearAll: () => set({ items: [] }),
    }),
    {
      name: 'cinema-paradiso-compare',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
