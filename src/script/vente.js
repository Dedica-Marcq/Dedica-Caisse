let panier = [];
let totalPanier = 0;
let produitsGlobaux = [];
let dossiersActuels = [];
let dossierActif = null;

function formatDateSQL(d) {
  const pad = (n) => n.toString().padStart(2, "0");
  return (
    d.getFullYear() + "-" +
    pad(d.getMonth() + 1) + "-" +
    pad(d.getDate()) + " " +
    pad(d.getHours()) + ":" +
    pad(d.getMinutes()) + ":" +
    pad(d.getSeconds())
  );
}

// Charger tous les produits et afficher les dossiers
async function chargerProduits() {
  produitsGlobaux = await window.api.getProduits();
  afficherDossiers();
}

// Afficher les dossiers
function afficherDossiers() {
  const productList = document.getElementById("product-list");
  productList.innerHTML = "";

  const dossiers = [...new Set(produitsGlobaux.map(p => p.dossier).filter(Boolean))];
  dossiersActuels = dossiers;

  dossiers.forEach(dossier => {
    const btn = document.createElement("button");
    btn.textContent = dossier;
    btn.onclick = () => afficherProduitsParDossier(dossier);
    productList.appendChild(btn);
  });
}

// Afficher les produits d’un dossier
function afficherProduitsParDossier(dossier) {
  const productList = document.getElementById("product-list");
  productList.innerHTML = "";

  const retourBtn = document.createElement("button");
  retourBtn.textContent = "⬅ Retour";
  retourBtn.classList.add("button-article");
  retourBtn.onclick = afficherDossiers;
  productList.appendChild(retourBtn);

  const produits = produitsGlobaux.filter(p => p.dossier === dossier);

  produits.forEach(prod => {
    const btn = document.createElement("button");
    btn.textContent = `${prod.nom} - ${parseFloat(prod.prix).toFixed(2)}€`;
    btn.onclick = () => ajouterAuPanier(prod);
    productList.appendChild(btn);
  });
}

function ajouterAuPanier(prod) {
  const existe = panier.find(p => p.id === prod.id);
  if (existe) {
    existe.quantite++;
  } else {
    panier.push({ id: prod.id, nom: prod.nom, prix: prod.prix, quantite: 1 });
  }
  majTicket();
}

function retirerArticle(prodId) {
  const item = panier.find(p => p.id === prodId);
  if (!item) return;
  item.quantite--;
  if (item.quantite <= 0) panier = panier.filter(p => p.id !== prodId);
  majTicket();
}

function majTicket() {
  const receiptBody = document.getElementById("receipt-body");
  receiptBody.innerHTML = "";
  totalPanier = 0;

  panier.forEach(prod => {
    const line = document.createElement("div");
    line.classList.add("receipt-line");

    const name = document.createElement("div");
    name.textContent = `${prod.nom} x${prod.quantite}`;

    const price = document.createElement("div");
    const total = prod.prix * prod.quantite;
    price.textContent = `${total.toFixed(2)}€`;

    const removeBtn = document.createElement("button");
    removeBtn.innerHTML = '<i style="color: #e76344;" class="bi bi-x-circle"></i>';
    removeBtn.style.border = "none";
    removeBtn.style.background = "transparent";
    removeBtn.style.cursor = "pointer";
    removeBtn.onclick = () => retirerArticle(prod.id);

    line.appendChild(name);
    line.appendChild(price);
    line.appendChild(removeBtn);
    receiptBody.appendChild(line);

    totalPanier += total;
  });

  document.getElementById("receipt-total").textContent =
    totalPanier.toFixed(2).replace('.', ',') + "€";
}

function ouvrirPopup(modePaiement) {
  document.getElementById("popup-total").textContent =
    totalPanier.toFixed(2) + "€";
  const popup = document.getElementById("popup-vente");
  popup.style.display = "block";

  document.getElementById("popup-confirmer").onclick = async () => {
    const client = document.getElementById("popup-client").value;
    const email = document.getElementById("popup-email").value;
    const adresse = document.getElementById("popup-adresse").value;

    const data = {
      client,
      email,
      adresse,
      modePaiement,
      total: totalPanier,
      date: formatDateSQL(new Date()),
      articles: panier
    };

    const result = await window.api.saveVente(data);
    if (result.success) {
      alert("Vente enregistrée !");
      panier = [];
      majTicket();
      popup.style.display = "none";
    } else {
      alert("Erreur : " + result.error);
    }
  };

  document.getElementById("popup-annuler").onclick = () => {
    popup.style.display = "none";
  };
}

// Boutons paiement
document.getElementById("btn-especes").onclick = () => ouvrirPopup("espèces");
document.getElementById("btn-cheque").onclick = () => ouvrirPopup("chèque");
document.getElementById("btn-cb").onclick = () => ouvrirPopup("carte bleue");

// Vider le panier
document.getElementById("btn-esc").onclick = () => {
  panier = [];
  majTicket();
};

// Charger les produits au démarrage
window.addEventListener("DOMContentLoaded", chargerProduits);

// Écouter les messages pour ajout depuis Dédica'Scan
window.api.receive("add-product", (produit) => {
  ajouterAuPanier(produit);
});