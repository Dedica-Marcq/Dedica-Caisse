let panier = []; // [{id, nom, prix, quantite}]
let totalPanier = 0;

// Fonction pour formatter la date au format SQL
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

// Récupérer les produits depuis la DB
async function chargerProduits() {
  const produits = await window.api.getProduits();
  const productList = document.getElementById("product-list");
  productList.innerHTML = "";

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
    removeBtn.innerHTML = '<i class="bi bi-x-circle"></i>';
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

// Ouvre le popup
function ouvrirPopup(modePaiement) {
  document.getElementById("popup-total").textContent =
    totalPanier.toFixed(2) + "€";
  const popup = document.getElementById("popup-vente");
  popup.style.display = "block";

  document.getElementById("popup-confirmer").onclick = async () => {
    const client = document.getElementById("popup-client").value;
    const email = document.getElementById("popup-email").value;
    const facture = document.getElementById("popup-facture").checked;

    const data = {
      client,
      email,
      facture,
      modePaiement,
      total: totalPanier,
      date: formatDateSQL(new Date()), // ✅ Format SQL
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

// Connecter les boutons de paiement
document.getElementById("btn-especes").onclick = () => ouvrirPopup("espèces");
document.getElementById("btn-cheque").onclick = () => ouvrirPopup("chèque");
document.getElementById("btn-cb").onclick = () => ouvrirPopup("carte bleue");

// Vider le panier
document.getElementById("btn-esc").onclick = () => {
  panier = [];
  majTicket();
};

// Charger les produits
window.addEventListener("DOMContentLoaded", chargerProduits);

// Ecouter les messages "add-product" pour ajouter un produit au panier
window.api.receive("add-product", (produit) => {
  ajouterAuPanier(produit);
});
