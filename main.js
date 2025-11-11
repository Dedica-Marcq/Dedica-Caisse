const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const mysql = require("mysql2/promise");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const { createMacMenu } = require("./menu.js");
const { generateFacture } = require("./js/facture.js");
const { sendFacture } = require("./js/mail.js");

// --- Connexion MySQL ---
const pool = mysql.createPool({
  host: "192.168.1.155",
  user: "root",
  database: "dedicamarcq_caisse",
  password: "D@rnakine=1979",
  waitForConnections: true,
  connectionLimit: 10,
});
let mainWindow;

// Fonction simple de vérification de la connexion à la BDD
async function isDBConnected() {
  try {
    const conn = await pool.getConnection();
    // ping ou simple requête pour valider la connexion
    await conn.ping();
    conn.release();
    return true;
  } catch (err) {
    console.error("BDD inaccessible :", err.message);
    return false;
  }
}

// --- Création de la fenêtre principale ---
async function createWindow() { // <-- rendu async
  mainWindow = new BrowserWindow({
    width: 1470,
    height: 870,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const dbOk = await isDBConnected();
  const startFile = dbOk ? "html/caisse.html" : "html/offline.html";
  mainWindow.loadFile(startFile); // charge caisse ou offline selon l'accès BDD
  createMacMenu(mainWindow);
}

app.whenReady().then(createWindow);

// -----------------------------------------------------------------------------
// 🔹 PRODUITS
// -----------------------------------------------------------------------------

ipcMain.handle("get-produits", async () => {
  const [rows] = await pool.execute("SELECT * FROM produits ORDER BY dossier ASC, nom ASC");
  return rows;
});

ipcMain.handle("add-produit", async (event, produit) => {
  try {
    const [result] = await pool.execute(
      `INSERT INTO produits (nom, code_barre, dossier, prix, tva)
       VALUES (?, ?, ?, ?, ?)`,
      [
        produit.nom,
        produit.code_barre || "",
        produit.dossier || "Sans dossier",
        produit.prix || 0,
        produit.tva || 0,
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
      `UPDATE produits SET nom=?, code_barre=?, dossier=?, prix=?, tva=? WHERE id=?`,
      [
        produit.nom,
        produit.code_barre || "",
        produit.dossier || "Sans dossier",
        produit.prix || 0,
        produit.tva || 0,
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
    `SELECT va.article_id, va.quantite, p.nom, p.prix
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

ipcMain.handle("send-facture", async (event, data) => {
  return await sendFacture(data);
});

// -----------------------------------------------------------------------------
// 🔹 RAPPORT / STATISTIQUES
// -----------------------------------------------------------------------------

ipcMain.handle("get-rapport", async () => {
  try {
    const [ventes] = await pool.query("SELECT total, mode_paiement FROM ventes");
    const [articles] = await pool.query(`
      SELECT p.nom, SUM(va.quantite) as total_vendu
      FROM vente_articles va
      JOIN produits p ON va.article_id = p.id
      GROUP BY p.id
      ORDER BY total_vendu DESC
      LIMIT 5
    `);

    const chiffreAffaires = ventes.reduce((sum, v) => sum + v.total, 0);
    const panierMoyen = ventes.length > 0 ? chiffreAffaires / ventes.length : 0;

    const paiementsMap = {};
    ventes.forEach(v => {
      if (!paiementsMap[v.mode_paiement]) paiementsMap[v.mode_paiement] = 0;
      paiementsMap[v.mode_paiement] += v.total;
    });

    return {
      chiffre_affaires: chiffreAffaires,
      panier_moyen: panierMoyen,
      paiements: Object.entries(paiementsMap).map(([mode, montant]) => ({
        mode_paiement: mode,
        montant,
      })),
      articles: articles.map(a => ({
        nom: a.nom,
        total_qte: a.total_vendu,
      })),
    };
  } catch (err) {
    console.error("Erreur get-rapport :", err);
    return { erreur: err.message };
  }
});

ipcMain.handle("get-stats", async () => {
  try {
    // Récupération des données brutes
    const [ventes] = await pool.query(`
      SELECT total, mode_paiement 
      FROM ventes 
      WHERE mode_paiement IN ('Carte Bleue', 'Chèque', 'Espèces')
    `);

    const [topArticles] = await pool.query(`
      SELECT p.nom, SUM(va.quantite) as quantite
      FROM vente_articles va
      JOIN produits p ON va.article_id = p.id
      GROUP BY p.id, p.nom
      ORDER BY quantite DESC
      LIMIT 5
    `);

    return {
      ventes,
      topArticles
    };

  } catch (err) {
    console.error("Erreur get-stats :", err);
    // Retourner null pour indiquer l'erreur
    return null;
  }
});

// -----------------------------------------------------------------------------
// 🔹 Dédica'Scan
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
