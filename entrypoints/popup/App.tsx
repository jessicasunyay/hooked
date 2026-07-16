import { useState } from "react";
import { useSettingsStore } from "@/src/store/settings";
import { sendToBackground } from "@/src/lib/messaging";
import { useTheme } from "@/src/lib/theme";
import { SaveForm } from "@/src/components/SaveForm";
import { YarnBall } from "@/src/components/YarnBall";
import { SettingsButton } from "@/src/components/SettingsButton";
import { SettingsView } from "@/src/components/SettingsView";

function App() {
  // keep <html> in sync with the user's theme setting (light/dark/system)
  useTheme();

  //pull values + setters from settings store
  const stitchModeEnabled = useSettingsStore((s) => s.stitchModeEnabled);
  const setStitchMode = useSettingsStore((s) => s.setStitchMode);

  //collapsed/expanded state for the save form
  const [showForm, setShowForm] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const toggleStitchMode = (enabled: boolean) => {
    setStitchMode(enabled);
    sendToBackground({ type: "STITCH_MODE_TOGGLE", enabled }).catch((error) =>
      console.error("[Hooked] Failed to send STITCH_MODE_TOGGLE:", error),
    );
  };

  //function to open side panel and close popup
  const openLibrary = async () => {
    await browser.sidePanel.setOptions({
      enabled: true,
      path: "sidepanel.html",
    });
    await browser.sidePanel.open({ windowId: browser.windows.WINDOW_ID_CURRENT });
    window.close();
  };

  if (settingsOpen) {
    return (
      <div className="w-96 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
        <SettingsView onBack={() => setSettingsOpen(false)} />
      </div>
    );
  }

  return (
    <div className="w-96 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      {/* branded header */}
      <header className="flex items-center justify-between bg-brand-light px-5 py-4 text-brand-dark dark:bg-brand-darker dark:text-white">
        <h1 className="font-display text-3xl tracking-tight text-brand-dark dark:text-white">Hooked</h1>
        <SettingsButton onClick={() => setSettingsOpen(true)} />
      </header>

      <div className="space-y-4 p-5">
        {/* stitch mode toggle — yarn ball hero */}
        <div className="flex flex-col items-center pt-1">
          <YarnBall
            active={stitchModeEnabled}
            onToggle={() => toggleStitchMode(!stitchModeEnabled)}
          />
          <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Stitch Mode</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {stitchModeEnabled
              ? "Hover abbreviations for definitions"
              : "Click the yarn ball to enable"}
          </p>
        </div>

        <hr className="border-sand-light dark:border-slate-700" />

        {/* collapsed save form / saved confirmation */}
        {showForm ? (
          <SaveForm
            onDone={() => setShowForm(false)}
            onSaved={() => {
              setShowForm(false);
              setJustSaved(true);
              setTimeout(() => window.close(), 1000);
            }}
          />
        ) : justSaved ? (
          <div className="flex items-center justify-center rounded-lg border border-brand-light bg-brand-light/20 px-3 py-2.5 text-sm font-medium text-brand-dark dark:border-brand-darker dark:bg-brand-darker/40 dark:text-white">
            Saved!
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="w-full rounded-lg border border-sand-dark px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-cream dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Save this page
          </button>
        )}

        <button
          onClick={openLibrary}
          className="w-full rounded-lg bg-brand-light px-3 py-2.5 text-sm font-semibold text-brand-dark shadow-sm transition hover:bg-brand-dark hover:text-white dark:bg-brand-darker dark:text-white dark:hover:bg-brand-dark"
        >
          Open Pattern Library
        </button>
      </div>
    </div>
  );
}

export default App;
