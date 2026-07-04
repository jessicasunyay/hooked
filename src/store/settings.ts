import { create } from "zustand"; //creates a Zustand store
import { persist, createJSONStorage } from "zustand/middleware";
import type { Terminology, Settings } from "@/src/types";
import { wxtStorage } from "./storage-adapter";

interface SettingsState extends Settings {
  setStitchMode: (enabled: boolean) => void;
  setAutoDetect: (enabled: boolean) => void;
  setTerminology: (terminology: Terminology) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist( //wraps the store so every change auto-saves to Chrome storage
    (set) => ({ //initial state + setter functions
      stitchModeEnabled: false,
      autoDetectEnabled: true,
      terminology: "us",
      customEntries: [],
      provider: "local",
      setStitchMode: (enabled) => set({ stitchModeEnabled: enabled }),
      setAutoDetect: (enabled) => set({ autoDetectEnabled: enabled }),
      setTerminology: (terminology) => set({ terminology }),
    }),
    { 
      name: "hooked-settings",
      storage: createJSONStorage(() => wxtStorage), //tells persist to use storage-adapter.ts
    },
  ),
);
