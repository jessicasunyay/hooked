import { onMessage, sendToActiveTab } from "@/src/lib/messaging";

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
});
