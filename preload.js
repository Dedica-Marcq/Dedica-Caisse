const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  getProduits: () => ipcRenderer.invoke("get-produits"),
  saveVente: (data) => ipcRenderer.invoke("save-vente", data),
  getVentes: () => ipcRenderer.invoke("get-ventes"),
  getVenteDetails: (id) => ipcRenderer.invoke("get-vente-details", id),
  generateFacture: (id) => ipcRenderer.invoke("generate-facture", id),
  addProduit: (data) => ipcRenderer.invoke("add-produit", data),
  updateProduit: (data) => ipcRenderer.invoke("update-produit", data),
  deleteProduit: (id) => ipcRenderer.invoke("delete-produit", id),
  getStats: () => ipcRenderer.invoke("get-stats"),
  receive: (channel, func) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args));
  },
});

contextBridge.exposeInMainWorld("emailAPI", {
  sendFacture: (data) => ipcRenderer.invoke("send-facture", data)
});