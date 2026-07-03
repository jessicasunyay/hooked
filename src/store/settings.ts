import { create } from "zustand"; //creates a Zustand store
import { persist, createJSONStorage } from "zustand/middleware";
import type { Region, Settings } from "@/src/types";
import { wxtStorage } from "./storage-adapter";

interface SettingsState extends Settings {
  setStitchMode: (enabled: boolean) => void;
  setAutoDetect: (enabled: boolean) => void;
  setRegion: (region: Region) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist( //wraps the store so every change auto-saves to Chrome storage
    (set) => ({ //initial state + setter functions
      stitchModeEnabled: false,
      autoDetectEnabled: true,
      region: "us",
      customEntries: [],
      provider: "local",
      setStitchMode: (enabled) => set({ stitchModeEnabled: enabled }),
      setAutoDetect: (enabled) => set({ autoDetectEnabled: enabled }),
      setRegion: (region) => set({ region }),
    }),
    { 
      name: "hooked-settings",
      storage: createJSONStorage(() => wxtStorage), //tells persist to use storage-adapter.ts
    },
  ),
);
