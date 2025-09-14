const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

async function generateFacture(pool, venteId) {
  try {
    // Récupérer les infos de la vente
    const [ventes] = await pool.execute(
      `SELECT * FROM ventes WHERE id = ?`,
      [venteId]
    );
    if (ventes.length === 0) throw new Error("Vente introuvable");
    const vente = ventes[0];

    // Récupérer les articles liés à la vente
    const [articles] = await pool.execute(
      `SELECT va.article_id, va.quantite, p.nom, p.prix, p.prix_achat
       FROM vente_articles va
       LEFT JOIN produits p ON va.article_id = p.id
       WHERE va.vente_id = ?`,
      [venteId]
    );

    // Créer dossier Documents/Dedica_Caisse si nécessaire
    const dirPath = path.join(require("os").homedir(), "Documents", "Dedica_Caisse");
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Définir le chemin du fichier
    const filePath = path.join(dirPath, `facture_${venteId}.pdf`);

    // Créer le document PDF
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Titre
    doc.fontSize(20).text("Facture", { align: "center" });
    doc.moveDown();

    // Infos client
    doc.fontSize(12).text(`Facture n°: ${venteId}`);
    doc.text(`Date: ${vente.date_vente}`);
    doc.text(`Nom client: ${vente.nom_client || "N/A"}`);
    if (vente.email_client) {
      doc.text(`Email client: ${vente.email_client}`);
    }
    doc.text(`Mode de paiement: ${vente.mode_paiement}`);
    doc.moveDown();

    // Tableau des articles
    doc.fontSize(14).text("Articles:", { underline: true });
    doc.moveDown(0.5);

    articles.forEach((a) => {
      const prix = parseFloat(a.prix) || 0;
      const prixAchat = parseFloat(a.prix_achat) || 0;
      const quantite = parseInt(a.quantite) || 0;
      const prixTotal = prix * quantite;
      const marge = prix - prixAchat;
      doc.fontSize(12).text(
        `${quantite}x ${a.nom} - Prix: ${prix.toFixed(2)} € - Total: ${prixTotal.toFixed(2)} € - Marge: ${marge.toFixed(2)} €`
      );
    });

    doc.moveDown();
    const totalGeneral = parseFloat(vente.total) || 0;
    doc.fontSize(14).text(`Total général: ${totalGeneral.toFixed(2)} €`, {
      align: "right",
    });

    // Finaliser le PDF
    doc.end();

    return new Promise((resolve, reject) => {
      stream.on("finish", () => {
        resolve(filePath);
      });
      stream.on("error", reject);
    });
  } catch (err) {
    console.error("Erreur génération facture:", err);
    throw err;
  }
}

module.exports = { generateFacture };