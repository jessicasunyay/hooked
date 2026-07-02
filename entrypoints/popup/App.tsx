import { useSettingsStore } from "@/src/store/settings";

function App() {
  const stitchModeEnabled = useSettingsStore((s) => s.stitchModeEnabled);
  const region = useSettingsStore((s) => s.region);
  const setStitchMode = useSettingsStore((s) => s.setStitchMode);
  const setRegion = useSettingsStore((s) => s.setRegion);

  const openLibrary = async () => {
    await chrome.sidePanel.setOptions({
      enabled: true,
      path: "sidepanel.html",
    });
    await chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT });
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
            onChange={(e) => setStitchMode(e.target.checked)}
            className="h-4 w-4"
          />
        </label>

        <div>
          <label className="text-sm font-medium block mb-1">Terminology</label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value as "us" | "uk")}
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
