import { useSettingsStore } from "@/src/store/settings";
import { SegmentedControl } from "./SegmentedControl";
import type { Status, Theme } from "@/src/types";

const TERMINOLOGY_OPTIONS = [
  { value: "us", label: "US" },
  { value: "uk", label: "UK" },
];

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "to-try", label: "To Try" },
  { value: "wip", label: "WIP" },
  { value: "completed", label: "Completed" },
];

interface SettingsViewProps {
  onBack: () => void;
}

// full-screen settings view. replaces the popup / side panel content while
// open — driven by view state owned by the parent App.
export function SettingsView({ onBack }: SettingsViewProps) {
  const terminology = useSettingsStore((s) => s.terminology);
  const setTerminology = useSettingsStore((s) => s.setTerminology);
  const defaultStatus = useSettingsStore((s) => s.defaultStatus);
  const setDefaultStatus = useSettingsStore((s) => s.setDefaultStatus);
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  return (
    <div className="flex h-full flex-col bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <header className="relative flex items-center border-b border-sand-light px-4 py-3 dark:border-slate-700">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
        >
          &larr; Back
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          Settings
        </h1>
      </header>

      <main className="flex-1 space-y-5 overflow-y-auto p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Theme
            </span>
            <span className="block text-xs text-slate-400 dark:text-slate-400">
              Light, Dark, or follow your system.
            </span>
          </div>
          <SegmentedControl
            options={THEME_OPTIONS}
            value={theme}
            onChange={(v) => setTheme(v as Theme)}
            ariaLabel="Theme"
          />
        </div>

        <div className="border-t border-sand-light dark:border-slate-700" />

        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Terminology
            </span>
            <span className="block text-xs text-slate-400 dark:text-slate-400">
              Preferred crochet terms shown in tooltips.
            </span>
          </div>
          <SegmentedControl
            options={TERMINOLOGY_OPTIONS}
            value={terminology}
            onChange={(v) => setTerminology(v as "us" | "uk")}
            ariaLabel="Terminology"
          />
        </div>

        <div className="border-t border-sand-light dark:border-slate-700" />

        <div>
          <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Default status
          </span>
          <span className="mb-2 block text-xs text-slate-400 dark:text-slate-400">
            Pre-filled for every new pattern you save.
          </span>
          <select
            value={defaultStatus}
            onChange={(e) => setDefaultStatus(e.target.value as Status)}
            className="w-full rounded border border-sand-dark bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-brand-light focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </main>
    </div>
  );
}

export default SettingsView;