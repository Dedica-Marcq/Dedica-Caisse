const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const mysql = require("mysql2/promise");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const os = require("os");

const { createMacMenu } = require("./menu.js");
const { generateFacture } = require("./js/facture.js");
const { sendFacture } = require("./js/mail.js");

// --- Connexion MySQL ---
let pool = null;
let mainWindow;

// Charger la configuration depuis config.json
function loadDatabaseConfig() {
  try {
    const configDir = path.join(app.getPath("userData"), "Ressources");
    const configPath = path.join(configDir, "config.json");
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, "utf-8");
      const config = JSON.parse(configData);
    } else {
      console.log("Erreur : Fichier config.json non trouvé");
    }
  } catch (err) {
    console.error("Erreur lors de la lecture de config.json:", err);
  }
  return null;
}

// Sauvegarder la configuration
function saveDatabaseConfig(config) {
  try {
    const configDir = path.join(app.getPath("userData"), "Ressources");
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    const configPath = path.join(configDir, "config.json");
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Erreur lors de la sauvegarde de config.json:", err);
    return false;
  }
}

// Initialiser le pool de connexion
function initializePool(config) {
  if (!config) {
    return null;
  }
  try {
    pool = mysql.createPool({
      host: config.host,
      port: config.port || 3306,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 10,
    });
    return pool;
  } catch (err) {
    console.error("Erreur lors de l'initialisation du pool:", err);
    return null;
  }
}

async function isDBConnected(maxAttempts = 1) {
  if (!pool) {
    console.log("Pas de pool disponible pour tester la connexion");
    return false;
  }
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const conn = await pool.getConnection();
      await conn.ping();
      conn.release();
      return true;
    } catch (err) {
      console.error(`❌ Échec tentative ${attempt}/${maxAttempts}:`, err.message);
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  return false;
}

// --- Création de la fenêtre principale ---
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1470,
    height: 870,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const dbConfig = loadDatabaseConfig();
  
  if (!dbConfig) {
    mainWindow.loadFile("html/assistant.html");
  } else {
    initializePool(dbConfig);
    const dbOk = await isDBConnected(2);
    
    if (dbOk) {
      mainWindow.loadFile("html/caisse.html");
    } else {
      mainWindow.loadFile("html/offline.html");
    }
  }

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

ipcMain.handle('save-vente', async (event, vente) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Normalisation des champs venant du rendu
    const totalVente = (vente && typeof vente.total !== 'undefined') ? vente.total : 0;
    const modePaiement = vente && (vente.modePaiement ?? vente.mode ?? null);
    const dateVente = vente && (vente.date ? new Date(vente.date) : new Date());
    const nomClient = vente && (vente.client ?? vente.nom_client ?? null);
    const emailClient = vente && (vente.email ?? vente.email_client ?? null);
    const adresseClient = vente && (vente.adresse ?? vente.adresse_client ?? null);

    // Inserer la vente avec les colonnes client/email/adresse pour éviter l'erreur SQL
    const [resVente] = await conn.execute(
      `INSERT INTO ventes (total, mode_paiement, date_vente, nom_client, email_client, adresse_client)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [totalVente, modePaiement, dateVente, nomClient, emailClient, adresseClient]
    );
    const venteId = resVente.insertId;

    // Traiter les articles (création des produits "unknown_*" si nécessaire)
    for (const art of (vente.articles || [])) {
      let articleId = art.id;

      if (typeof articleId === 'string' && articleId.startsWith('unknown_')) {
        const nomProd = art.nom ?? art.name ?? 'Article inconnu';
        const prixProd = (typeof art.prix !== 'undefined') ? art.prix : (art.price ?? 0);
        const tvaProd = (typeof art.tva !== 'undefined') ? art.tva : 5.5;
        let codeBarreProd = (art.codeBarre ?? art.code_barre ?? null);
        if (codeBarreProd === "") codeBarreProd = null;
        const dossierProd = (art.dossier ?? null);

        const [resProd] = await conn.execute(
          'INSERT INTO produits (nom, prix, tva, code_barre, dossier) VALUES (?, ?, ?, ?, ?)',
          [nomProd, prixProd, tvaProd, codeBarreProd, dossierProd]
        );
        articleId = resProd.insertId;
      }

      const quantite = (art.quantite ?? 1);
      await conn.execute(
        'INSERT INTO vente_articles (vente_id, article_id, quantite) VALUES (?, ?, ?)',
        [venteId, articleId, quantite]
      );
    }

    await conn.commit();
    return { success: true, venteId };
  } catch (err) {
    await conn.rollback();
    console.error("Erreur save-vente :", err);
    return { success: false, error: err.message };
  } finally {
    conn.release();
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
// 🔹 MESSAGES / NOTIFICATIONS
// -----------------------------------------------------------------------------

ipcMain.handle("send-message", async (event, message) => {
  try {
    // Diffuser le message à toutes les fenêtres ouvertes
    const allWindows = BrowserWindow.getAllWindows();
    allWindows.forEach((win) => {
      if (win && !win.isDestroyed()) {
        win.webContents.send("new-message", { message, timestamp: new Date().toISOString() });
      }
    });
    return { success: true };
  } catch (err) {
    console.error("Erreur envoi message :", err);
    return { success: false, error: err.message };
  }
});

// -----------------------------------------------------------------------------
// 🔹 CONFIGURATION BASE DE DONNÉES
// -----------------------------------------------------------------------------

ipcMain.handle("save-db-config", async (event, config) => {
  try {
    const saved = saveDatabaseConfig(config);
    if (saved) {
      // Réinitialiser le pool avec la nouvelle configuration
      initializePool(config);
      const connected = await isDBConnected(2);
      return { success: true, connected };
    }
    return { success: false, error: "Erreur lors de la sauvegarde" };
  } catch (err) {
    console.error("Erreur save-db-config:", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("test-db-connection", async (event, config) => {
  try {
    const testPool = mysql.createPool({
      host: config.host,
      port: config.port || 3306,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 1,
    });

    const conn = await testPool.getConnection();
    await conn.ping();
    conn.release();
    await testPool.end();
    
    return { success: true, connected: true };
  } catch (err) {
    console.error("Erreur test-db-connection:", err);
    return { success: false, connected: false, error: err.message };
  }
});

ipcMain.handle("load-db-config", async () => {
  try {
    const config = loadDatabaseConfig();
    return { success: true, config };
  } catch (err) {
    console.error("Erreur load-db-config:", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("open-caisse", async () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.loadFile("html/caisse.html");
    return { success: true };
  }
  return { success: false };
});

ipcMain.handle("open-articles", async () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.loadFile("html/articles.html");
    return { success: true };
  }
  return { success: false };
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
