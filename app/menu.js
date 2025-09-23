// menu.js
const { Menu, app } = require('electron');

function createMacMenu(mainWindow) {
  const isMac = process.platform === 'darwin';

  const template = [
    ...(isMac ? [{
      label: 'DédicaCaisse',
      submenu: [
        {
          label: 'À propos de DédicaCaisse',
          role: 'about',
          
        },
        { type: 'separator' },
        {
          label: 'Réglages',
          accelerator: 'CmdOrCtrl+,',
        },
        { type: 'separator' },
        { 
          label: 'Masquer DédicaCaisse',
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
          label: 'Quitter DédicaCaisse',
          accelerator: 'CmdOrCtrl+Q',
          role: 'quit'
        }
      ]
    }] : []),

    // Menu Fichier
    {
      label: 'Fichier',
      submenu: [
        {
          label: 'Ouvrir la caisse',
          accelerator: 'CmdOrCtrl+N',
        },
        { type: 'separator' },
        { role: 'close' }
      ]
    },
    // Menu Édition
    {
        label: 'Édition',
        submenu: [
            {
                label: 'Annuler',
                accelerator: 'CmdOrCtrl+Z',
                role: 'undo'
            },
            {
                label: 'Rétablir',
                accelerator: 'Shift+CmdOrCtrl+Z',
                role: 'redo'
            },
            { type: 'separator' },
            {
                label: 'Couper',
                accelerator: 'CmdOrCtrl+X',
                role: 'cut'
            },
            {
                label: 'Copier',
                accelerator: 'CmdOrCtrl+C',
                role: 'copy'
            },
            {
                label: 'Coller',
                accelerator: 'CmdOrCtrl+V',
                role: 'paste'
            },
            {
                label: 'Sélectionner tout',
                accelerator: 'CmdOrCtrl+A',
                role: 'selectAll'
            }
        ]
    },
// Menu Fenêtre
{
  label: 'Fenêtre',
  submenu: [
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
      label: 'Réglages',
      accelerator: 'CmdOrCtrl+4',
      click: () => mainWindow.loadFile('reglages.html'),
    },
    {type: 'separator' },
    {
      label: 'Se déconnecter',
      accelerator: 'CmdOrCtrl+Shift+-',
      click: () => mainWindow.webContents.send('logout'),
  },
    { type: 'separator' },
    {
          label: 'Afficher les outils de développement',
          accelerator: 'CmdOrCtrl+I',
          click: () => mainWindow.webContents.toggleDevTools()
    },
    {
      label: 'Réactualiser',
      accelerator: 'CmdOrCtrl+R',
      role: 'reload'
    }

  ]
}
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

module.exports = { createMacMenu };