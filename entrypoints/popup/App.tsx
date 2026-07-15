import { useState } from "react";
import { useSettingsStore } from "@/src/store/settings";
import { sendToBackground } from "@/src/lib/messaging";
import { SaveForm } from "@/src/components/SaveForm";
import { YarnBall } from "@/src/components/YarnBall";
import { SettingsButton } from "@/src/components/SettingsButton";
import { SettingsView } from "@/src/components/SettingsView";

function App() {
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
      <div className="w-96 bg-white text-slate-900">
        <SettingsView onBack={() => setSettingsOpen(false)} />
      </div>
    );
  }

  return (
    <div className="w-96 bg-white text-slate-900">
      {/* branded header */}
      <header className="relative flex items-center justify-center bg-brand-light px-5 py-4 text-brand-dark">
        <div className="text-center">
          <h1 className="text-lg font-bold tracking-tight">Hooked</h1>
          <p className="mt-0.5 text-xs font-medium text-brand-dark/70">
            Your crochet pattern companion
          </p>
        </div>
        <div className="absolute right-2 top-2">
          <SettingsButton onClick={() => setSettingsOpen(true)} />
        </div>
      </header>

      <div className="space-y-4 p-5">
        {/* stitch mode toggle — yarn ball hero */}
        <div className="flex flex-col items-center pt-1">
          <YarnBall
            active={stitchModeEnabled}
            onToggle={() => toggleStitchMode(!stitchModeEnabled)}
          />
          <p className="mt-3 text-sm font-semibold text-slate-700">Stitch Mode</p>
          <p className="text-xs text-slate-500">
            {stitchModeEnabled
              ? "Hover abbreviations for definitions"
              : "Click the yarn ball to enable"}
          </p>
        </div>

        <hr className="border-slate-200" />

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
          <div className="flex items-center justify-center rounded-lg border border-brand-light bg-brand-light/20 px-3 py-2.5 text-sm font-medium text-brand-dark">
            Saved!
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Save this page
          </button>
        )}

        <button
          onClick={openLibrary}
          className="w-full rounded-lg bg-brand-light px-3 py-2.5 text-sm font-semibold text-brand-dark shadow-sm transition hover:bg-brand-dark hover:text-white"
        >
          Open Pattern Library
        </button>
      </div>
    </div>
  );
}

export default App;
