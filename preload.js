const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  getProduits: () => ipcRenderer.invoke("get-produits"),
  saveVente: (data) => ipcRenderer.invoke("save-vente", data),
  receive: (channel, func) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args));
  }
});