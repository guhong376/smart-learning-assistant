import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import path from 'node:path';

const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 700,
    title: '智能学习助手（桌面端）',
    webPreferences: {
      preload: path.join(app.getAppPath(), 'electron', 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev) {
    win.loadURL('http://127.0.0.1:5173');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  ipcMain.handle('sla:openPath', async (_event, filePath) => {
    try {
      if (typeof filePath !== 'string' || filePath.length === 0) return { ok: false, error: 'invalid_path' };
      if (!path.isAbsolute(filePath)) return { ok: false, error: 'path_not_absolute' };
      const err = await shell.openPath(filePath);
      if (err) return { ok: false, error: err };
      return { ok: true };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  });

  ipcMain.handle('sla:pickFile', async () => {
    const res = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'PPT/PDF/音频/图片', extensions: ['ppt', 'pptx', 'pdf', 'mp3', 'wav', 'm4a', 'png', 'jpg', 'jpeg', 'webp'] },
        { name: '全部文件', extensions: ['*'] }
      ]
    });
    if (res.canceled || res.filePaths.length === 0) return { ok: false, error: 'canceled' };
    return { ok: true, filePath: res.filePaths[0] };
  });

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});


