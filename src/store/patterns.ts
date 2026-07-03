import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { PatternCard } from "@/src/types";
import { wxtStorage } from "./storage-adapter";

interface PatternsState {
  cards: PatternCard[];
  addCard: (card: Omit<PatternCard, "id" | "dateSaved">) => void;
  updateCard: (id: string, updates: Partial<PatternCard>) => void;
  deleteCard: (id: string) => void;
}

export const usePatternsStore = create<PatternsState>()(
  persist(
    (set) => ({
      cards: [],
      addCard: (card) => //takes a card without id/dateSaved and auto-generates a UUID and date before adding to array
        set((state) => ({
          cards: [
            ...state.cards,
            {
              ...card,
              id: crypto.randomUUID(),
              dateSaved: Date.now(),
            },
          ],
        })),
      updateCard: (id, updates) => //finds card with matching id and updates it
        set((state) => ({
          cards: state.cards.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),
      deleteCard: (id) => //filters out card with matching id
        set((state) => ({
          cards: state.cards.filter((c) => c.id !== id),
        })),
    }),
    {
      name: "hooked-patterns",
      storage: createJSONStorage(() => wxtStorage), //tells persist to use storage-adapter.ts
    },
  ),
);
