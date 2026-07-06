import { useSettingsStore } from "@/src/store/settings";
import { sendToBackground } from "@/src/lib/messaging";

function App() {
  //pull values + setters from settings store
  const stitchModeEnabled = useSettingsStore((s) => s.stitchModeEnabled);
  const terminology = useSettingsStore((s) => s.terminology);
  const setStitchMode = useSettingsStore((s) => s.setStitchMode);
  const setTerminology = useSettingsStore((s) => s.setTerminology);

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
      <h1 className="text-xl font-bold mb-4">Hooked</h1>

      <div className="space-y-4">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm font-medium">Stitch Mode</span>
          <input
            type="checkbox"
            checked={stitchModeEnabled}
            onChange={(e) => toggleStitchMode(e.target.checked)}
            className="h-4 w-4"
          />
        </label>

        <div>
          <label className="text-sm font-medium block mb-1">Terminology</label>
          <select
            value={terminology}
            onChange={(e) => setTerminology(e.target.value as "us" | "uk")}
            className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
          >
            <option value="us">US</option>
            <option value="uk">UK</option>
          </select>
        </div>

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
