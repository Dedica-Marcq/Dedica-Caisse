const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

async function generateFacture(pool, venteId) {
  try {
    const [ventes] = await pool.execute(
      `SELECT * FROM ventes WHERE id = ?`,
      [venteId]
    );
    if (ventes.length === 0) throw new Error("Vente introuvable");
    const vente = ventes[0];

    const [articles] = await pool.execute(
      `SELECT va.article_id, va.quantite, p.nom, p.prix, p.tva
       FROM vente_articles va
       LEFT JOIN produits p ON va.article_id = p.id
       WHERE va.vente_id = ?`,
      [venteId]
    );

    const dirPath = path.join(require("os").homedir(), "/Documents/Dedica_Caisse");
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const filePath = path.join(dirPath, `facture_${venteId}.pdf`);

    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const blue = "#2274A5";
    const bold = "Helvetica-Bold";
    const regular = "Helvetica";

    let y = 50;
    let x = 50;

    const logoPath = path.join(require("os").homedir(), "Documents", "Dedica_Caisse", "Ressources", "Logo.png");
    doc.image(logoPath, x, y, { width: 60, height: 60 });
    y += 60 + 5;
    doc.font(bold).fontSize(16).text("Dédica’Marcq", x, y, { align: "left" });
    
    let formattedDate = vente.date_vente;
    try {
      const dateObj = new Date(vente.date_vente);
      const pad = (n) => (n < 10 ? "0" + n : n);
      const day = pad(dateObj.getDate());
      const month = pad(dateObj.getMonth() + 1);
      const year = dateObj.getFullYear();
      formattedDate = `${day}/${month}/${year}`;
    } catch (e) {
      formattedDate = vente.date_vente;
    }
    let metaY = 50 + 40;
    doc.font(regular).fontSize(12).fillColor(blue)
      .text(`FACTURE N° ${venteId}`, 0, metaY, { align: "right" });
    metaY += 18;
    doc.text(`DATE ${formattedDate}`, 0, metaY, { align: "right" });
    doc.fillColor("black");
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

    let tableTop = Math.max(clientY + 20, metaY + 25);
    doc.moveTo(50, tableTop).lineTo(545, tableTop).strokeColor("#CCCCCC").lineWidth(1).stroke();
    tableTop += 15;

    const designationX = 60;
    const designationWidth = 200;
    const quantiteX = designationX + designationWidth + 10;
    const quantiteWidth = 40;
    const tvaX = quantiteX + quantiteWidth + 10;
    const tvaWidth = 50;
    const puHTX = tvaX + tvaWidth + 10;
    const puHTWidth = 70;
    const totalTTCX = puHTX + puHTWidth + 10;
    const totalTTCWidth = 70;

    let rowY = tableTop + 10;
    doc.font(bold).fontSize(13).fillColor(blue)
      .text("Désignation", designationX, rowY, { width: designationWidth, align: "left" })
      .text("Qté", quantiteX, rowY, { width: quantiteWidth, align: "right" })
      .text("TVA", tvaX, rowY, { width: tvaWidth, align: "right" })
      .text("PU HT", puHTX, rowY, { width: puHTWidth, align: "right" })
      .text("Total TTC", totalTTCX, rowY, { width: totalTTCWidth, align: "right" });

    rowY += 22;
    doc.fillColor("black").font(regular);

    let totalTTC = 0;
    let totalHT = 0;

    articles.forEach((a) => {
      const prixTTC = parseFloat(a.prix) || 0;
      const quantite = parseInt(a.quantite) || 0;
      const tvaPct = parseFloat(a.tva) || 0;

      const prixHT = prixTTC / (1 + tvaPct / 100);
      const totalArticleTTC = prixTTC * quantite;

      totalTTC += totalArticleTTC;
      totalHT += prixHT * quantite;

      if (rowY > doc.page.height - 150) {
        doc.addPage({ margin: 50 });
        rowY = 50;
      }
      const lineStartY = rowY;

      const designationHeight = doc.heightOfString(a.nom, { width: designationWidth });
      doc.font(regular).fontSize(12)
        .text(a.nom, designationX, rowY, { width: designationWidth, align: "left" });

      doc.text(quantite, quantiteX, lineStartY, { width: quantiteWidth, align: "right" })
        .text(`${tvaPct.toFixed(2)} %`, tvaX, lineStartY, { width: tvaWidth, align: "right" })
        .text(prixHT.toFixed(2), puHTX, lineStartY, { width: puHTWidth, align: "right" })
        .text(totalArticleTTC.toFixed(2), totalTTCX, lineStartY, { width: totalTTCWidth, align: "right" });

      rowY = lineStartY + Math.max(designationHeight, 20);

      doc.moveTo(designationX, rowY).lineTo(545, rowY).strokeColor("#CCCCCC").stroke();
      rowY += 5;
    });

    rowY += 10;

    const montantTVA = totalTTC - totalHT;

    doc.font(bold).fontSize(13).fillColor(blue)
      .text("Total HT", designationX, rowY, { width: designationWidth, align: "left" });
    doc.fillColor("black").font(bold).fontSize(13)
      .text(`${totalHT.toFixed(2)} €`, totalTTCX, rowY, { width: totalTTCWidth, align: "right" });
    rowY += 20;

    doc.font(bold).fontSize(13).fillColor(blue)
      .text("Montant TVA", designationX, rowY, { width: designationWidth, align: "left" });
    doc.fillColor("black").font(bold).fontSize(13)
      .text(`${montantTVA.toFixed(2)} €`, totalTTCX, rowY, { width: totalTTCWidth, align: "right" });
    rowY += 20;

    doc.font(bold).fontSize(13).fillColor(blue)
      .text("Total TTC", designationX, rowY, { width: designationWidth, align: "left" });
    doc.fillColor("black").font(bold).fontSize(13)
      .text(`${totalTTC.toFixed(2)} €`, totalTTCX, rowY, { width: totalTTCWidth, align: "right" });
    rowY += 30;

    const footerY = doc.page.height - 120;
    function drawFooter() {
      doc.moveTo(50, footerY - 10).lineTo(545, footerY - 10).strokeColor("#CCCCCC").lineWidth(1).stroke();
      doc.font("Helvetica-Bold").fontSize(12).fillColor(blue)
        .text("Éditions de la Licorne", 50, footerY, { align: "left" });
      doc.font("Helvetica").fontSize(10).fillColor("black")
        .text("46 Rue de Molpas 59710 Mérignies", 50, footerY + 15, { align: "left" })
        .text("N° TVA intracommunautaire : FR39805216991", 50, footerY + 30, { align: "left" })
        .text("Siret : 80521699100010", 50, footerY + 45, { align: "left" });
    }
    doc.end();

    return await new Promise((resolve, reject) => {
      stream.on("finish", () => {
        resolve(filePath);
      });

      stream.on("error", (err) => {
        console.error("❌ Erreur écriture PDF :", err);
        reject(err);
      });
    });
  } catch (err) {
    console.error("Erreur génération facture:", err);
    throw err;
  }
}

module.exports = { generateFacture };