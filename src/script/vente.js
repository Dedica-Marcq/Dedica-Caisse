// vente.js
const { ipcRenderer } = require("electron");

let panier = []; // { id, nom, prix, quantite }
let caissier = "Basile"; // tu pourras relier ça à la session connectée

function ajouterAuPanier(article) {
  const exist = panier.find(p => p.id === article.id);
  if (exist) {
    exist.quantite++;
  } else {
    panier.push({ ...article, quantite: 1 });
  }
}

// --------- POPUP DE FINALISATION ---------
function ouvrirPopupFinalisation(montant, modePaiement) {
  const popup = document.createElement("div");
  popup.classList.add("popup");

  popup.innerHTML = `
    <div class="popup-content">
      <h3>Finaliser la vente</h3>
      <p>Montant total : <b>${montant.toFixed(2)} €</b></p>
      <label>Nom client :</label>
      <input type="text" id="client-nom" placeholder="Nom du client">
      <label>Email client :</label>
      <input type="email" id="client-mail" placeholder="exemple@domaine.fr">
      <label>
        <input type="checkbox" id="client-facture">
        Envoyer facture par mail
      </label>
      <div class="popup-actions">
        <button id="confirmer-vente">Confirmer</button>
        <button id="annuler-vente">Annuler</button>
      </div>
    </div>
  `;

  document.body.appendChild(popup);

  document.getElementById("annuler-vente").onclick = () => popup.remove();
  document.getElementById("confirmer-vente").onclick = () => {
    const nom = document.getElementById("client-nom").value;
    const mail = document.getElementById("client-mail").value;
    const factureMail = document.getElementById("client-facture").checked;

    finaliserVente(modePaiement, nom, mail, factureMail);
    popup.remove();
  };
}

// --------- FINALISATION ---------
async function finaliserVente(modePaiement, nomClient, emailClient, factureMail) {
  const total = panier.reduce((sum, item) => sum + item.prix * item.quantite, 0);
  const date = new Date();
  const dateStr = date.toLocaleDateString("fr-FR") + " " + date.toLocaleTimeString("fr-FR");

  try {
    const res = await ipcRenderer.invoke("save-vente", {
      client: nomClient,
      email: emailClient || null,
      caissier,
      modePaiement,
      total,
      date: dateStr,
      articles: panier
    });

    if (res.success) {
      console.log("✅ Vente enregistrée avec l’ID :", res.venteId);
      panier = [];
    } else {
      console.error("❌ Erreur lors de l’enregistrement :", res.error);
      alert("Erreur : " + res.error);
    }
  } catch (err) {
    console.error("❌ Exception lors de l’enregistrement :", err);
    alert("Une erreur est survenue : " + err.message);
  }
}

// --------- MÉTHODES DE PAIEMENT ---------
document.getElementById("btn-especes").onclick = () => {
  const total = panier.reduce((s, p) => s + p.prix * p.quantite, 0);
  ouvrirPopupFinalisation(total, "Espèces");
};

document.getElementById("btn-cheque").onclick = () => {
  const total = panier.reduce((s, p) => s + p.prix * p.quantite, 0);
  ouvrirPopupFinalisation(total, "Chèque");
};

document.getElementById("btn-cb").onclick = () => {
  const total = panier.reduce((s, p) => s + p.prix * p.quantite, 0);
  ouvrirPopupFinalisation(total, "Carte Bleue");
};

// ESC = vider le panier
document.getElementById("btn-esc").onclick = () => {
  panier = [];
  console.log("Panier vidé");
};

// TODO: un jour tu pourras mettre ici la fonction pour transmettre le montant au TPE ;)