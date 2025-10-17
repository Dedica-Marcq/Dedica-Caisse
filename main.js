const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const mysql = require("mysql2/promise");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const { createMacMenu } = require('./app/menu.js');
const { generateFacture } = require('./src/script/facture.js');

// --- Connexion MySQL ---
const pool = mysql.createPool({
  host: "mysql-bargicloud.alwaysdata.net",
  user: "413421_dedicadev",
  database: "bargicloud_dedica_dev",
  password: "dedicadev2025",
  waitForConnections: true,
  connectionLimit: 10,
});

let mainWindow;

// --- Création de la fenêtre principale ---
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

  mainWindow.loadFile("caisse.html"); // Page d’accueil par défaut
  createMacMenu(mainWindow);
}

app.whenReady().then(createWindow);

// -----------------------------------------------------------------------------
// 🔹 PRODUITS — utilisés dans articles.html
// -----------------------------------------------------------------------------

ipcMain.handle("get-produits", async () => {
  const [rows] = await pool.execute("SELECT * FROM produits ORDER BY dossier ASC, nom ASC");
  return rows;
});

ipcMain.handle("add-produit", async (event, produit) => {
  try {
    const [result] = await pool.execute(
      `INSERT INTO produits (nom, code_barre, stock, dossier, prix, tva, prix_achat)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        produit.nom,
        produit.code_barre || "",
        produit.stock || 0,
        produit.dossier || "Sans dossier",
        produit.prix || 0,
        produit.tva || 0,
        produit.prix_achat || 0,
      ]
    );
    return { success: true, id: result.insertId };
  } catch (err) {
    console.error("Erreur ajout produit :", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("update-produit", async (event, produit) => {
  try {
    await pool.execute(
      `UPDATE produits SET nom=?, code_barre=?, stock=?, dossier=?, prix=?, tva=?, prix_achat=? WHERE id=?`,
      [
        produit.nom,
        produit.code_barre || "",
        produit.stock || 0,
        produit.dossier || "Sans dossier",
        produit.prix || 0,
        produit.tva || 0,
        produit.prix_achat || 0,
        produit.id,
      ]
    );
    return { success: true };
  } catch (err) {
    console.error("Erreur update produit :", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("delete-produit", async (event, produitId) => {
  try {
    await pool.execute("DELETE FROM produits WHERE id = ?", [produitId]);
    return { success: true };
  } catch (err) {
    console.error("Erreur suppression produit :", err);
    return { success: false, error: err.message };
  }
});

// -----------------------------------------------------------------------------
// 🔹 VENTES
// -----------------------------------------------------------------------------

ipcMain.handle("save-vente", async (event, data) => {
  try {
    const [result] = await pool.execute(
      `INSERT INTO ventes (nom_client, email_client, adresse_client, mode_paiement, total, date_vente)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.client, data.email, data.adresse, data.modePaiement, data.total, data.date]
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

ipcMain.handle("get-ventes", async () => {
  const [rows] = await pool.execute(
    `SELECT id, date_vente, total FROM ventes ORDER BY id DESC`
  );
  return rows;
});

ipcMain.handle("get-vente-details", async (e, id) => {
  const [[vente]] = await pool.execute(
    `SELECT id, date_vente, total, nom_client, email_client, adresse_client, mode_paiement
     FROM ventes WHERE id = ?`,
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

// -----------------------------------------------------------------------------
// 🔹 Dédica'Scan (ajout via code-barres)
// -----------------------------------------------------------------------------
const serverApp = express();
serverApp.use(cors());
serverApp.use(bodyParser.json());

serverApp.post("/addProductByBarcode", async (req, res) => {
  const { barcode } = req.body;
  try {
    const [rows] = await pool.execute("SELECT * FROM produits WHERE code_barre = ?", [barcode]);
    if (rows.length > 0) {
      const produit = rows[0];
      if (mainWindow) mainWindow.webContents.send("add-product", produit);
      res.json(produit);
    } else {
      res.status(404).json({ error: "Produit non trouvé" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

serverApp.listen(3001, () => {
  console.log("Dédica'Scan démarré sur le port 3001");
});