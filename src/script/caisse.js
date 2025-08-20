console.log("vente.js chargé !");

async function displayProducts() {
  const products = await window.api.getProduits();
  const productList = document.getElementById('product-list');
  productList.innerHTML = '';
  products.forEach(prod => {
    const prix = parseFloat(prod.prix);
    const btn = document.createElement('button');
    btn.textContent = `${prod.nom} - ${!isNaN(prix) ? prix.toFixed(2) + '€' : 'Prix invalide'}`;
    btn.onclick = () => {
      if (!isNaN(prix)) {
        addToReceipt(prod);
      } else {
        alert(`Le prix de l'article "${prod.nom}" est invalide.`);
      }
    };
    productList.appendChild(btn);
  });
}

let receipt = [];

let total = 0;
console.log("Bouton trouvé ?", document.getElementById('receipt-body'));
const receiptBody = document.getElementById('receipt-body');
const receiptTotal = document.getElementById('receipt-total');

function addToReceipt(prod) {
  const { nom, prix } = prod;
  const parsedPrix = parseFloat(prix);

  // Check if item already exists
  const existingLine = Array.from(receiptBody.children).find(line =>
    line.dataset.nom === nom
  );

  if (existingLine) {
    const qtyEl = existingLine.querySelector('.item-qty');
    const currentQty = parseInt(qtyEl.textContent.replace('x', '')) || 1;
    qtyEl.textContent = `x${currentQty + 1}`;
    existingLine.dataset.qty = currentQty + 1;
  } else {
    const line = document.createElement('div');
    line.classList.add('receipt-line');
    line.dataset.nom = nom;
    line.dataset.qty = 1;

    const name = document.createElement('div');
    name.classList.add('item-name');
    name.textContent = nom;

    const qty = document.createElement('div');
    qty.classList.add('item-qty');
    qty.textContent = 'x1';

    const price = document.createElement('div');
    price.classList.add('item-price');
    price.textContent = `${parsedPrix.toFixed(2)}€`;

    const removeBtn = document.createElement('button');
    removeBtn.classList.add('remove-btn');
    removeBtn.innerHTML = '<i class="bi bi-x-circle"></i>';
    removeBtn.onclick = () => {
      let qtyVal = parseInt(line.dataset.qty);
      if (qtyVal > 1) {
        qtyVal -= 1;
        line.dataset.qty = qtyVal;
        const qtyEl = line.querySelector('.item-qty');
        qtyEl.textContent = `x${qtyVal}`;
      } else {
        line.remove();
      }
      total -= parsedPrix;
      receiptTotal.textContent = total.toFixed(2).replace('.', ',') + '€';
    };

    line.appendChild(name);
    line.appendChild(qty);
    line.appendChild(price);
    line.appendChild(removeBtn);
    receiptBody.appendChild(line);
  }

  total += parsedPrix;
  receiptTotal.textContent = total.toFixed(2).replace('.', ',') + '€';
}

function updateReceipt() {
  const receiptBody = document.getElementById('receipt-body');
  receiptBody.innerHTML = '';
  let total = 0;
  receipt.forEach(prod => {
    const div = document.createElement('div');
    div.textContent = `${prod.nom} - ${parseFloat(prod.prix).toFixed(2)}€`;
    receiptBody.appendChild(div);
    total += parseFloat(prod.prix);
  });
  document.getElementById('receipt-total').textContent = total.toFixed(2) + '€';
}

window.addEventListener('DOMContentLoaded', displayProducts);

// ESC button clears receipt
document.addEventListener('DOMContentLoaded', () => {
  const escBtn = document.querySelector('.actions .esc');
  escBtn.addEventListener('click', () => {
    receiptBody.innerHTML = '';
    total = 0;
    receiptTotal.textContent = '0,00€';
  });
});

async function finaliserVente(modePaiement) {
  const vente = {
    date: new Date().toISOString(),
    caissier: window.user?.nom || 'inconnu',
    client: null, // à renseigner plus tard
    modePaiement,
    total,
    articles: []
  };

  document.querySelectorAll('.receipt-line').forEach(line => {
    vente.articles.push({
      nom: line.dataset.nom,
      quantite: parseInt(line.dataset.qty || 1)
    });
  });

  try {
    await window.api.enregistrerVente(vente);
    alert('Vente enregistrée avec succès ✅');

    // Reset ticket
    receiptBody.innerHTML = '';
    total = 0;
    receiptTotal.textContent = '0,00€';
  } catch (err) {
    console.error('Erreur lors de la sauvegarde de la vente :', err);
    alert('Erreur lors de l’enregistrement de la vente ❌');
  }
}