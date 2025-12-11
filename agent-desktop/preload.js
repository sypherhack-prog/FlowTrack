// agent-desktop/preload.js
// Expose a minimal API to the renderer, including a screen capture helper.

const { contextBridge, ipcRenderer } = require('electron');

async function captureScreen() {
  try {
    const arrayBuffer = await ipcRenderer.invoke('flowtrack:capture-screen');
    if (!arrayBuffer) return null;
    return arrayBuffer;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[FlowTrack Agent] preload captureScreen failed', err);
    return null;
  }
}

contextBridge.exposeInMainWorld('flowtrackAgent', {
  version: '0.1.0',
  captureScreen,
});
