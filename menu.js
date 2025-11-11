const { Menu } = require('electron');

function createMacMenu(mainWindow) {
  const isMac = process.platform === 'darwin';

  const template = [
    {
      label: 'Dédica\'Caisse',
      submenu: [
        {
          label: 'À propos de Dédica\'Caisse',
          role: 'about',
        },
        { type: 'separator' },
        {
          label: 'Réglages',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow.loadFile('html/assistant.html');
          }
        },
        { type: 'separator' },
        { 
          label: 'Masquer DédicaCaisse',
          role: 'hide', 
          accelerator: 'CmdOrCtrl+H',
        },
        { 
          label: 'Masquer les autres',
          accelerator: 'CmdOrCtrl+Shift+H',
          role: 'hideothers' 
        },
        { 
          label: 'Tout afficher',
          role: 'unhide', 
          accelerator: 'CmdOrCtrl+Alt+H'
        },
        { 
          label: 'Quitter DédicaCaisse',
          accelerator: 'CmdOrCtrl+Q',
          role: 'quit'
        }
      ]
    },

    {
      label: 'Fichier',
      submenu: [
        {
          label: 'Nouvelle Vente',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.loadFile('html/caisse.html');
          }
        },
        { type: 'separator' },
        {
          label: 'Caisse',
          accelerator: 'CmdOrCtrl+1',
          click: () => mainWindow.loadFile('html/caisse.html'),
        },
        {
          label: 'Ventes',
          accelerator: 'CmdOrCtrl+2',
          click: () => mainWindow.loadFile('html/ventes.html'),
        },
        {
          label: 'Articles',
          accelerator: 'CmdOrCtrl+3',
          click: () => mainWindow.loadFile('html/articles.html'),
        },
        {
          label: 'Rapport',
          accelerator: 'CmdOrCtrl+4',
          click: () => mainWindow.loadFile('html/rapport.html'),
        },
        { type: 'separator' },
        {
          label: 'Show DevTools',
          accelerator: isMac ? 'Cmd+Alt+I' : 'Ctrl+Shift+I',
          role: 'toggleDevTools'
        },
        {
          label: 'Fermer la fenêtre',
          accelerator: 'CmdOrCtrl+W',
          role: 'close'
        }
      ]
    },

    {
      label: 'Édition',
      submenu: [
        { role: 'undo', label: 'Annuler', accelerator: 'CmdOrCtrl+Z' },
        { role: 'redo', label: 'Rétablir', accelerator: 'Shift+CmdOrCtrl+Z' },
        { type: 'separator' },
        { role: 'cut', label: 'Couper', accelerator: 'CmdOrCtrl+X' },
        { role: 'copy', label: 'Copier', accelerator: 'CmdOrCtrl+C' },
        { role: 'paste', label: 'Coller', accelerator: 'CmdOrCtrl+V' },
        { role: 'selectAll', label: 'Tout sélectionner', accelerator: 'CmdOrCtrl+A' },
      ]
    },

    {
      label: 'Fenêtre',
      role: 'window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' }
        ] : []),
        {
          label: 'Recharger la page',
          accelerator: 'CmdOrCtrl+R',
          role: 'reload',
        },
        
      ]
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

module.exports = { createMacMenu };