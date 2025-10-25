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
      `SELECT va.article_id, va.quantite, p.nom, p.prix, p.prix_achat, p.tva
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
      const hours = pad(dateObj.getHours());
      const minutes = pad(dateObj.getMinutes());
      formattedDate = `${day}/${month}/${year} ${hours}:${minutes}`;
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
    // --- (Fin Partie En-tête) ---

    // Move below header for table
    let tableTop = Math.max(clientY + 20, metaY + 25, vendeurY + 10);
    doc.moveTo(50, tableTop).lineTo(545, tableTop).strokeColor("#CCCCCC").lineWidth(1).stroke();
    tableTop += 15;

    // Table headers
    const descX = 60;
    const tvaRightEdgeX = 430; // Nouvelle référence pour aligner le '%'
    const tvaWidth = 50;       // Largeur de la colonne TVA
    const tvaStartX = tvaRightEdgeX - tvaWidth; // 380

    const numberRightEdgeX = 525; // Bordure droite pour les chiffres
    const numberWidth = 65;       // Largeur de la colonne de chiffres
    const numberStartX = numberRightEdgeX - numberWidth; // 460
    const symbolX = 530;          // Position (fixe) du symbole €
    const symbolWidth = 20;       // Largeur pour le symbole €

    let rowY = tableTop + 10;
    doc.font(bold).fontSize(13).fillColor(blue)
      .text("Description", descX, rowY, { align: "left" });
    
    // <-- MODIFIÉ : En-tête TVA aligné à droite avec le '%'
    doc.text("TVA", tvaStartX, rowY, { width: tvaWidth, align: "right" }); 
    
    // <-- MODIFIÉ : En-tête Montant
    // Positionné de manière à ce que son bord droit soit aligné avec le symbolX.
    // Il faut mesurer la largeur du texte "Montant" pour le positionner précisément.
    const montantTextWidth = doc.widthOfString("Montant");
    doc.text("Montant", symbolX - montantTextWidth, rowY, { 
        width: montantTextWidth, 
        align: "left" 
    });


    rowY += 22;
    doc.fillColor("black").font(regular);

    // Calcul et affichage ligne par ligne
    let totalHT = 0;
    let totalTVA = 0;
    articles.forEach((a) => {
      const prix = parseFloat(a.prix) || 0;
      const quantite = parseInt(a.quantite) || 0;
      const tvaPct = parseFloat(a.tva) || 0;
      const prixTotalHT = prix * quantite;
      const montantTVA = prixTotalHT * (tvaPct / 100);
      const prixTTC = prixTotalHT + montantTVA; // On calcule le TTC
      totalHT += prixTotalHT;
      totalTVA += montantTVA;

      doc.font(regular).fontSize(12)
        .text(`${a.nom} x${quantite}`, descX, rowY)
        // <-- MODIFIÉ : Utilise les nouvelles positions pour la TVA
        .text(`${tvaPct.toFixed(2)} %`, tvaStartX, rowY, { width: tvaWidth, align: "right" })
        
        // Affiche le prix TTC de la ligne
        .text(prixTTC.toFixed(2), numberStartX, rowY, { 
            width: numberWidth, 
            align: "right" 
        })
        .text("€", symbolX, rowY, { 
            width: symbolWidth, 
            align: "left" 
        });

      rowY += 20;
      doc.moveTo(descX, rowY).lineTo(545, rowY).strokeColor("#CCCCCC").stroke();
      rowY += 5; 

    }); // Fin de forEach

    // Final rows: Total HT, TVA, Total TTC
    rowY += 5; 
    const totalTTC = totalHT + totalTVA;

    // Total HT
    doc.font(bold).fontSize(13).fillColor(blue)
      .text("Total HT", descX, rowY, { align: "left" });
    doc.fillColor("black").font(bold).fontSize(13)
      .text(totalHT.toFixed(2), numberStartX, rowY, { 
          width: numberWidth, 
          align: "right" 
      })
      .text("€", symbolX, rowY, { 
          width: symbolWidth, 
          align: "left" 
      });
    rowY += 20;

    // TVA
    doc.font(bold).fontSize(13).fillColor(blue)
      .text("TVA", descX, rowY, { align: "left" });
    doc.fillColor("black").font(bold).fontSize(13)
      .text(totalTVA.toFixed(2), numberStartX, rowY, { 
          width: numberWidth, 
          align: "right" 
      })
      .text("€", symbolX, rowY, { 
          width: symbolWidth, 
          align: "left" 
      });
    rowY += 20;

    // Total TTC
    doc.font(bold).fontSize(13).fillColor(blue)
      .text("Total TTC", descX, rowY, { align: "left" });
    doc.fillColor("black").font(bold).fontSize(13)
      .text(totalTTC.toFixed(2), numberStartX, rowY, { 
          width: numberWidth, 
          align: "right" 
      })
      .text("€", symbolX, rowY, { 
          width: symbolWidth, 
          align: "left" 
      });
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