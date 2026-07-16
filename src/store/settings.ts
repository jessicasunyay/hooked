import { create } from "zustand"; //creates a Zustand store
import { persist, createJSONStorage } from "zustand/middleware";
import type { Terminology, Settings, Status, Theme } from "@/src/types";
import { wxtStorage } from "./storage-adapter";

interface SettingsState extends Settings {
  setStitchMode: (enabled: boolean) => void;
  setAutoDetect: (enabled: boolean) => void;
  setTerminology: (terminology: Terminology) => void;
  setDefaultStatus: (status: Status) => void;
  setTheme: (theme: Theme) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist( //wraps the store so every change auto-saves to Chrome storage
    (set) => ({ //initial state + setter functions
      stitchModeEnabled: false,
      autoDetectEnabled: true,
      terminology: "us",
      defaultStatus: "to-try",
      customEntries: [],
      provider: "local",
      theme: "light",
      setStitchMode: (enabled) => set({ stitchModeEnabled: enabled }),
      setAutoDetect: (enabled) => set({ autoDetectEnabled: enabled }),
      setTerminology: (terminology) => set({ terminology }),
      setDefaultStatus: (defaultStatus) => set({ defaultStatus }),
      setTheme: (theme) => set({ theme }),
    }),
    { 
      name: "hooked-settings",
      storage: createJSONStorage(() => wxtStorage), //tells persist to use storage-adapter.ts
    },
  ),
);
