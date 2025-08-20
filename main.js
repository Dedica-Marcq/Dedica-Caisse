const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { verifyLogin } = require('./src/script/connexion.js');
const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: 'mysql-bargicloud.alwaysdata.net',
  user: '413421_dedicadev',
  database: 'bargicloud_dedica_dev',
  password: 'dedicadev2025',
  waitForConnections: true,
  connectionLimit: 10
});
const { createMacMenu } = require('./macOS/menu.js');

// Variable pour vérifier qu'on est déjà connecté
let sessionUser = null;

ipcMain.handle('get-produits', async () => {
  const [rows] = await pool.execute('SELECT * FROM produits');
  return rows;
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1470,
    height: 870,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile('connexion.html');
  return win;
}

app.whenReady().then(() => {
  const win = createWindow();
  createMacMenu(win);
});

ipcMain.handle('login', async (event, { nom, motDePasse }) => {
  const user = await verifyLogin(nom, motDePasse);
  if (user) {
    sessionUser = user;
    return { success: true, user };
  } else {
    return { success: false };
  }
});

ipcMain.handle('is-authenticated', () => {
  return sessionUser !== null;
});

ipcMain.handle('logout', () => {
  sessionUser = null;
  return true;
});

ipcMain.handle('save-vente', async (event, data) => {
  try {
    const [result] = await pool.execute(
      `INSERT INTO ventes (nom_client, email_client, caissier, mode_paiement, total, date_vente)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.client, data.email, data.caissier, data.modePaiement, data.total, data.date]
    );

    const venteId = result.insertId;

    for (const article of data.articles) {
      await pool.execute(
        `INSERT INTO vente_produits (vente_id, article_id, quantite)
         VALUES (?, ?, ?)`,
        [venteId, article.id, article.quantite]
      );
    }

    return { success: true, venteId };
  } catch (err) {
    console.error("Erreur lors de l'enregistrement de la vente :", err);
    return { success: false, error: err.message };
  }
});

app.setAboutPanelOptions({
  applicationName: 'Dédica\'Caisse',
  applicationVersion: '1.0.0',
  copyright: '© 2025',
  credits: 'Développé par Basile BARGIBANT',
});