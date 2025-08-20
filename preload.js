const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // 🔐 Authentification
  login: (nom, motDePasse) => ipcRenderer.invoke('login', { nom, motDePasse }),
  isAuthenticated: () => ipcRenderer.invoke('is-authenticated'),
  logout: () => ipcRenderer.invoke('logout'),

  // 🛒 Produits
  getProduits: () => ipcRenderer.invoke('get-produits')
});
contextBridge.exposeInMainWorld('electronAPI', {
  onLogout: (callback) => ipcRenderer.on('logout', callback)
});
