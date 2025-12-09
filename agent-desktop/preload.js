// agent-desktop/preload.js
// Expose a minimal API to the renderer, including a screen capture helper.

const { contextBridge, desktopCapturer } = require('electron');

async function captureScreen() {
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: 1280, height: 720 },
  });

  if (!sources.length) return null;

  const primary = sources[0];
  const pngBuffer = primary.thumbnail.toPNG();
  // Expose a plain ArrayBuffer to the renderer
  return pngBuffer.buffer.slice(pngBuffer.byteOffset, pngBuffer.byteOffset + pngBuffer.byteLength);
}

contextBridge.exposeInMainWorld('flowtrackAgent', {
  version: '0.1.0',
  captureScreen,
});
