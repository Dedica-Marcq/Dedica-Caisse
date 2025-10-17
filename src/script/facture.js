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
      `SELECT va.article_id, va.quantite, p.nom, p.prix, p.prix_achat, p.tva
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

    // Styles
    const blue = "#2274A5";
    const bold = "Helvetica-Bold";
    const regular = "Helvetica";

    // Logo (~60px) at top left
    let y = 50;
    let x = 50;

        doc.image('src/images/logo.png', x, y, { width: 60, height: 60 });


    // Dédica’Marcq below logo, bold
    y += 60 + 5;
    doc.font(bold).fontSize(16).text("Dédica’Marcq", x, y, { align: "left" });


    // Format date_vente as DD/MM/YYYY HH:MM
    let formattedDate = vente.date_vente;
    try {
      const dateObj = new Date(vente.date_vente);
      const pad = (n) => (n < 10 ? "0" + n : n);
      const day = pad(dateObj.getDate());
      const month = pad(dateObj.getMonth() + 1);
      const year = dateObj.getFullYear();
      const hours = pad(dateObj.getHours());
      const minutes = pad(dateObj.getMinutes());
      formattedDate = `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (e) {
      // fallback to raw if parsing fails
      formattedDate = vente.date_vente;
    }

    // Top right: metadata (smaller blue)
    let metaY = 50 + 40; // below FACTURE
    doc.font(regular).fontSize(12).fillColor(blue)
      .text(`FACTURE N° ${venteId}`, 0, metaY, { align: "right" });
    metaY += 18;
    doc.text(`DATE ${formattedDate}`, 0, metaY, { align: "right" });
    doc.fillColor("black");

    // DESTINATAIRE section under logo
    let clientY = y + 30;
    doc.font(bold).fontSize(12).fillColor(blue)
      .text("DESTINATAIRE", x, clientY, { align: "left" });
    clientY += 18;
    doc.fillColor("black").font(regular).fontSize(12)
      .text(vente.nom_client || "", x, clientY, { align: "left" });
    clientY += 16;
    if (vente.email_client) {
      doc.text(vente.email_client, x, clientY, { align: "left" });
      clientY += 16;
    }
    if (vente.adresse_client) {
      doc.text(vente.adresse_client, x, clientY, { align: "left" });
      clientY += 16;
    }

    // VENDEUR section next to DESTINATAIRE
    let vendeurX = 300;
    let vendeurY = y + 30;
    doc.font(bold).fontSize(12).fillColor(blue)
      .text("VENDEUR", vendeurX, vendeurY, { align: "left" });
    vendeurY += 18;

    doc.fillColor("black").font(bold).fontSize(12)
      .text("Éditions de la Licorne", vendeurX, vendeurY, { align: "left" });
    vendeurY += 16;

    doc.fillColor("black").font(regular).fontSize(12)
      .text("46 Rue de Molpas 59710 Mérignies", vendeurX, vendeurY, { align: "left" });
    vendeurY += 16;
    doc.text("N° TVA intracommunautaire : FR39805216991", vendeurX, vendeurY, { align: "left" });
    vendeurY += 16;
    doc.text("Siret : 80521699100010", vendeurX, vendeurY, { align: "left" });
    vendeurY += 16;

    // Move below header for table
    let tableTop = Math.max(clientY + 20, metaY + 25, vendeurY + 10);
    doc.moveTo(50, tableTop).lineTo(545, tableTop).strokeColor("#CCCCCC").lineWidth(1).stroke();
    tableTop += 15;

    // Table headers
    const descX = 60;
    const tvaX = 100;
    const montantX = 500;
    let rowY = tableTop + 10;
    doc.font(bold).fontSize(13).fillColor(blue)
      .text("Description", descX, rowY, { align: "left" });
    doc.text("TVA", tvaX, rowY, { align: "right" });
    doc.text("Montant", montantX, rowY, { align: "right" });
    rowY += 22;
    doc.fillColor("black").font(regular);

    // Table rows: articles
    let totalHT = 0;
    let totalTVA = 0;
    articles.forEach((a) => {
      const prix = parseFloat(a.prix) || 0;
      const quantite = parseInt(a.quantite) || 0;
      const tvaPct = parseFloat(a.tva) || 0;
      const prixTotalHT = prix * quantite;
      const montantTVA = prixTotalHT * (tvaPct / 100);
      totalHT += prixTotalHT;
      totalTVA += montantTVA;
      // Description: name + quantity
      doc.font(regular).fontSize(12)
        .text(`${a.nom} x${quantite}`, descX, rowY, { align: "left" });
      // TVA percentage
      doc.text(`${tvaPct.toFixed(0)} %`, tvaX, rowY, { align: "right" });
      // Montant: prixTotalHT
      doc.text(`${prixTotalHT.toFixed(2)} €`, montantX, rowY, { align: "right" });
      rowY += 20;
      doc.moveTo(descX, rowY).lineTo(545, rowY).strokeColor(blue).stroke();
    });

    // Final rows: Total HT, TVA, Total TTC
    rowY += 8;
    const totalTTC = totalHT + totalTVA;

    doc.font(bold).fontSize(13).fillColor(blue)
      .text("Total HT", descX, rowY, { align: "left" });
    doc.fillColor("black").text(`${totalHT.toFixed(2)} €`, montantX, rowY, { align: "right" });
    rowY += 20;

    doc.font(bold).fontSize(13).fillColor(blue)
      .text("TVA", descX, rowY, { align: "left" });
    doc.fillColor("black").text(`${totalTVA.toFixed(2)} €`, montantX, rowY, { align: "right" });
    rowY += 20;

    doc.font(bold).fontSize(13).fillColor(blue)
      .text("Total TTC", descX, rowY, { align: "left" });
    doc.fillColor("black").text(`${totalTTC.toFixed(2)} €`, montantX, rowY, { align: "right" });
    rowY += 30;


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