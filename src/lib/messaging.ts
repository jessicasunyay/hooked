export type ExtensionMessage =
  | { type: "STITCH_MODE_TOGGLE"; enabled: boolean };


// used by the popup to communicate with background
// received by the background's onMessage listener.
export async function sendToBackground(message: ExtensionMessage): Promise<void> {
  await browser.runtime.sendMessage(message);
}

// sends a message to the content script in the active tab
export async function sendToActiveTab(message: ExtensionMessage): Promise<void> {
  // tabs.query returns an array, we want to isolate the active tab
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return; // no active tab
  try {
    await browser.tabs.sendMessage(tab.id, message);
  } catch (error) {
    console.warn("[Hooked] No content script on active tab:", error);
  }
}


// registers a listener that fires whenever any message arrives
// returns an unsubscribe function
export function onMessage(
  handler: (message: ExtensionMessage) => void,
): () => void {
  const listener = (msg: unknown) => {
    if (isExtensionMessage(msg)) { //calls type guard
      handler(msg);
    }
  };
  browser.runtime.onMessage.addListener(listener);
  return () => {
    browser.runtime.onMessage.removeListener(listener);
  };
}


// type guard
function isExtensionMessage(msg: unknown): msg is ExtensionMessage {
  if (typeof msg !== "object" || msg === null || !("type" in msg)) {
    return false;
  }
  const type = (msg as { type: unknown }).type;
  return type === "STITCH_MODE_TOGGLE";
}
