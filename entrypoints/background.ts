export default defineBackground(() => {
  browser.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: false })
    .catch((error: unknown) => console.error(error));
});

/*Runs once when the extension loads, tells Chrome not to open side panel*/