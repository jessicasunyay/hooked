import type { StateStorage } from "zustand/middleware";

//bridge between Zustand and Chrome, tells Zustand to save to Chrome's local storage

export const wxtStorage: StateStorage = {
  getItem: async (name) => { //reads from Chrome storage
    const value = await storage.getItem<string>(`local:${name}`);
    return value ?? null;
  },
  setItem: async (name, value) => { //writes to Chrome storage
    await storage.setItem(`local:${name}`, value);
  },
  removeItem: async (name) => { //deletes
    await storage.removeItem(`local:${name}`);
  },
};