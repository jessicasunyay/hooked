import { useState } from "react";
import { useSettingsStore } from "@/src/store/settings";
import { sendToBackground } from "@/src/lib/messaging";
import { SaveForm } from "@/src/components/SaveForm";
import { Toggle } from "@/src/components/Toggle";
import { SegmentedControl } from "@/src/components/SegmentedControl";

// terminology options for the segmented control
const TERMINOLOGY_OPTIONS = [
  { value: "us", label: "US" },
  { value: "uk", label: "UK" },
];

function App() {
  //pull values + setters from settings store
  const stitchModeEnabled = useSettingsStore((s) => s.stitchModeEnabled);
  const terminology = useSettingsStore((s) => s.terminology);
  const setStitchMode = useSettingsStore((s) => s.setStitchMode);
  const setTerminology = useSettingsStore((s) => s.setTerminology);

  //collapsed/expanded state for the save form
  const [showForm, setShowForm] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

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

  return (
    <div className="w-80 p-4 bg-white text-slate-900">
      <h1 className="mb-3 text-xl font-bold">Hooked</h1>

      <div className="space-y-3">
        {/* compact controls row */}
        <div className="flex items-center justify-between gap-3">
          <Toggle
            label="Stitch Mode"
            checked={stitchModeEnabled}
            onChange={toggleStitchMode}
          />
          <SegmentedControl
            options={TERMINOLOGY_OPTIONS}
            value={terminology}
            onChange={(v) => setTerminology(v as "us" | "uk")}
            ariaLabel="Terminology"
          />
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
          <div className="flex items-center justify-center rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
            Saved!
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Save this page
          </button>
        )}

        <button
          onClick={openLibrary}
          className="w-full rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Open Pattern Library
        </button>
      </div>
    </div>
  );
}

export default App;
