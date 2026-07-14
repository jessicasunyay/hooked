import { onMessage, sendToActiveTab } from "@/src/lib/messaging";
import { useSettingsStore } from "@/src/store/settings";

export default defineBackground(() => {
  // tells Chrome not to open the side panel when the user clicks the extension icon
  browser.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: false })
    .catch((error: unknown) => console.error(error));

  // listens for messages from the popup
  // forwards to content script when the popup sends STITCH_MODE_TOGGLE
  onMessage((message) => {
    switch (message.type) {
      case "STITCH_MODE_TOGGLE":
        sendToActiveTab(message).catch((error: unknown) =>
          console.error("[Hooked] Failed to relay STITCH_MODE_TOGGLE:", error),
        );
        break;
    }
  });

  // AI: Keyboard shortcut handler (Chrome commands API).
  // The command is declared in wxt.config.ts manifest.commands.
  // When the user hits Ctrl+Shift+H (Cmd+Shift+H on Mac):
  //   1. Rehydrate the store from chrome.storage.local (the service worker
  //      may have been killed and restarted since the last use, so the
  //      in-memory store could be stale. Rehydrate ensures we read the
  //      latest persisted value.)
  //   2. Read the current stitchModeEnabled value
  //   3. Flip it + persist via the store setter (writes to storage)
  //   4. Send STITCH_MODE_TOGGLE to the active tab so the content script
  //      activates/deactivates immediately
  browser.commands.onCommand.addListener((command: string) => {
    if (command !== "toggle-stitch-mode") return;

    Promise.resolve(useSettingsStore.persist.rehydrate())
      .then(() => {
        const enabled = useSettingsStore.getState().stitchModeEnabled;
        const newEnabled = !enabled;
        useSettingsStore.getState().setStitchMode(newEnabled);
        return sendToActiveTab({ type: "STITCH_MODE_TOGGLE", enabled: newEnabled });
      })
      .catch((error: unknown) =>
        console.error("[Hooked] Failed to handle keyboard shortcut:", error),
      );
  });
});
