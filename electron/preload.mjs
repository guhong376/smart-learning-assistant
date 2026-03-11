import { contextBridge, ipcRenderer, webUtils } from 'electron';

contextBridge.exposeInMainWorld('sla', {
  ping: () => 'pong',
  openPath: (filePath) => ipcRenderer.invoke('sla:openPath', filePath),
  pickFile: () => ipcRenderer.invoke('sla:pickFile'),
  getPathForFile: (file) => {
    try {
      return webUtils.getPathForFile(file);
    } catch {
      return null;
    }
  }
});


