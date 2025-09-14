const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const mysql = require("mysql2/promise");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

// Charger le menu macOS
const { createMacMenu } = require('./macOS/menu.js');

const { generateFacture } = require('./src/script/facture.js');

const pool = mysql.createPool({
  host: "mysql-bargicloud.alwaysdata.net",
  user: "413421_dedicadev",
  database: "bargicloud_dedica_dev",
  password: "dedicadev2025",
  waitForConnections: true,
  connectionLimit: 10,
});

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1470,
    height: 870,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.loadFile("caisse.html");
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

// getVentes : renvoie toujours { id, date_vente, total }
ipcMain.handle('get-ventes', async () => {
  const [rows] = await pool.execute(
    `SELECT id, date_vente, total
     FROM ventes
     ORDER BY id DESC`
  );
  return rows;
});

// getVenteDetails : renvoie vente { id, date_vente, total, nom_client, email_client, mode_paiement }
// et items { produit_id, quantite, nom }
ipcMain.handle('get-vente-details', async (e, id) => {
  const [[vente]] = await pool.execute(
    `SELECT id, date_vente, total, nom_client, email_client, mode_paiement
     FROM ventes
     WHERE id = ?`,
    [id]
  );

  const [items] = await pool.execute(
    `SELECT va.article_id, va.quantite, p.nom, p.prix, p.prix_achat
     FROM vente_articles va
     LEFT JOIN produits p ON p.id = va.article_id
     WHERE va.vente_id = ?
     ORDER BY va.id`,
    [id]
  );

  return { vente: vente || null, items };
});

ipcMain.handle("generate-facture", async (event, venteId) => {
  try {
    const result = await generateFacture(pool, venteId);
    return { success: true, result };
  } catch (error) {
    console.error("Erreur génération facture :", error);
    return { success: false, error: error.message };
  }
});

const serverApp = express();
serverApp.use(cors());
serverApp.use(bodyParser.json());

serverApp.post("/addProductByBarcode", async (req, res) => {
  const { barcode } = req.body;
  try {
    const [rows] = await pool.execute("SELECT * FROM produits WHERE code_barre = ?", [barcode]);
    if (rows.length > 0) {
      const produit = rows[0];
      if (mainWindow) {
        mainWindow.webContents.send("add-product", produit);
      }
      res.json(produit);
    } else {
      res.status(404).json({ error: "Produit non trouvé" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

serverApp.listen(3001, () => {
  console.log("Démarrage de Dédica'Scan sur le port 3001");
});