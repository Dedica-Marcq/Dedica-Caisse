const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  getProduits: () => ipcRenderer.invoke("get-produits"),
  saveVente: (data) => ipcRenderer.invoke("save-vente", data),
  getVentes: () => ipcRenderer.invoke("get-ventes"),
  getVenteDetails: (id) => ipcRenderer.invoke("get-vente-details", id),
  generateFacture: (id) => ipcRenderer.invoke("generate-facture", id),
  receive: (channel, func) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args));
  }
});