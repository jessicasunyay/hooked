import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Region, Settings } from "@/src/types";
import { wxtStorage } from "./storage-adapter";

interface SettingsState extends Settings {
  setStitchMode: (enabled: boolean) => void;
  setAutoDetect: (enabled: boolean) => void;
  setRegion: (region: Region) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
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
      storage: createJSONStorage(() => wxtStorage),
    },
  ),
);
