const { Menu } = require('electron');

function createMacMenu(mainWindow) {
  const isMac = process.platform === 'darwin';

  const template = [
    ...(isMac ? [{
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
            mainWindow.loadFile('reglages.html');
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
    }] : []),

    {
      label: 'Fichier',
      submenu: [
        {
          label: 'Nouvelle Vente',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('clear-panier');
          }
        },
        { type: 'separator' },
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
        { type: 'separator' },
        {
          label: 'Caisse',
          accelerator: 'CmdOrCtrl+1',
          click: () => mainWindow.loadFile('caisse.html'),
        },
        {
          label: 'Ventes',
          accelerator: 'CmdOrCtrl+2',
          click: () => mainWindow.loadFile('ventes.html'),
        },
        {
          label: 'Articles',
          accelerator: 'CmdOrCtrl+3',
          click: () => mainWindow.loadFile('articles.html'),
        },
        {
          label: 'Afficher les outils de développement',
          accelerator: 'CmdOrCtrl+I',
          click: () => {
            mainWindow.webContents.openDevTools();
          }
        },
        { type: 'separator'},
        {
          label: 'Recharger la page',
          accelerator: 'CmdOrCtrl+R',
          role: 'reload',
        },
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

module.exports = { createMacMenu };