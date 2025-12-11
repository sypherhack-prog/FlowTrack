// agent-desktop/main.js
// Minimal Electron main process for FlowTrack Desktop Agent

const path = require('path');
const { app, BrowserWindow, desktopCapturer, ipcMain } = require('electron');

function createMainWindow() {
  const win = new BrowserWindow({
    width: 420,
    height: 640,
    resizable: false,
    title: 'FlowTrack Agent',
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, 'index.html'));
}

async function setupIpc() {
  ipcMain.handle('flowtrack:capture-screen', async () => {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: 1280, height: 720 },
      });

      if (!sources.length) return null;

      const primary = sources[0];
      const pngBuffer = primary.thumbnail.toPNG();
      return pngBuffer.buffer.slice(pngBuffer.byteOffset, pngBuffer.byteOffset + pngBuffer.byteLength);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[FlowTrack Agent] Failed to capture screen in main process', err);
      return null;
    }
  });
}

app.whenReady().then(async () => {
  await setupIpc();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
