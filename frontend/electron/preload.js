const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Directory selection
  selectDirectory: (defaultPath) => ipcRenderer.invoke('select-directory', defaultPath),

  // App info
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),

  // Get system paths
  getPath: (name) => ipcRenderer.invoke('get-path', name),

  // Check if running in Electron
  isElectron: true,
});
