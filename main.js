const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const mysql = require("mysql2/promise");

// Charger le menu macOS
//const { createMacMenu } = require('./macOS/menu.js');

const pool = mysql.createPool({
  host: "mysql-bargicloud.alwaysdata.net",
  user: "413421_dedicadev",
  database: "bargicloud_dedica_dev",
  password: "dedicadev2025",
  waitForConnections: true,
  connectionLimit: 10,
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1470,
    height: 870,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile("caisse.html");
}

app.whenReady().then(createWindow);

ipcMain.handle("get-produits", async () => {
  const [rows] = await pool.execute("SELECT * FROM produits");
  return rows;
});

ipcMain.handle("save-vente", async (event, data) => {
  try {
    const [result] = await pool.execute(
      `INSERT INTO ventes (nom_client, email_client, mode_paiement, total, date_vente)
       VALUES (?, ?, ?, ?, ?)`,
      [data.client, data.email, data.modePaiement, data.total, data.date]
    );

    const venteId = result.insertId;

    for (const article of data.articles) {
      await pool.execute(
        `INSERT INTO vente_articles (vente_id, article_id, quantite)
         VALUES (?, ?, ?)`,
        [venteId, article.id, article.quantite]
      );
    }

    return { success: true, venteId };
  } catch (err) {
    console.error("Erreur enregistrement :", err);
    return { success: false, error: err.message };
  }
});