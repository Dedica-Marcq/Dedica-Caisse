(async () => {
  console.log("caisse.js chargé !");

  async function displayProducts() {
    const products = await window.electronAPI.getProduits();
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

  function updateTotalFromReceipt() {
    let newTotal = 0;
    document.querySelectorAll('.receipt-line').forEach(line => {
      const qty = parseInt(line.dataset.qty) || 1;
      const priceText = line.querySelector('.item-price').textContent.replace('€', '').replace(',', '.');
      const price = parseFloat(priceText) || 0;
      newTotal += price * qty;
    });
    total = newTotal;
    receiptTotal.textContent = total.toFixed(2).replace('.', ',') + '€';
  }

  window.addEventListener('DOMContentLoaded', () => {
    displayProducts();

    // ESC button clears receipt
    const escBtn = document.querySelector('.actions .esc');
    if (escBtn) {
      escBtn.addEventListener('click', () => {
        receiptBody.innerHTML = '';
        total = 0;
        receiptTotal.textContent = '0,00€';
      });
    }

    // Payment buttons listeners
    const btnEspeces = Array.from(document.querySelectorAll('.actions button'))
      .find(b => b.textContent.trim().toLowerCase() === 'espèces');
    if (btnEspeces) btnEspeces.addEventListener('click', () => finaliserVente('espèces'));

    const btnCheque = Array.from(document.querySelectorAll('.actions button'))
      .find(b => b.textContent.trim().toLowerCase() === 'chèque');
    if (btnCheque) btnCheque.addEventListener('click', () => finaliserVente('chèque'));

    const btnCB = Array.from(document.querySelectorAll('.actions button'))
      .find(b => b.textContent.trim().toLowerCase() === 'carte bleue');
    if (btnCB) btnCB.addEventListener('click', () => finaliserVente('cb'));
  });

  // finaliserVente now opens a popup to get client info and option facture
  async function finaliserVente(modePaiement) {
    if (document.querySelectorAll('.receipt-line').length === 0) {
      alert('Le ticket est vide, veuillez ajouter des articles avant de finaliser la vente.');
      return;
    }

    updateTotalFromReceipt();

    // Create popup elements
    const popup = document.createElement('div');
    popup.classList.add('popup-overlay');
    popup.style.position = 'fixed';
    popup.style.top = '0';
    popup.style.left = '0';
    popup.style.width = '100vw';
    popup.style.height = '100vh';
    popup.style.backgroundColor = 'rgba(0,0,0,0.5)';
    popup.style.display = 'flex';
    popup.style.justifyContent = 'center';
    popup.style.alignItems = 'center';
    popup.style.zIndex = '1000';

    const form = document.createElement('form');
    form.style.backgroundColor = 'white';
    form.style.padding = '20px';
    form.style.borderRadius = '8px';
    form.style.minWidth = '300px';
    form.style.boxShadow = '0 0 10px rgba(0,0,0,0.25)';

    const title = document.createElement('h2');
    title.textContent = 'Informations client et facture';
    form.appendChild(title);

    const labelNom = document.createElement('label');
    labelNom.textContent = 'Nom client: ';
    const inputNom = document.createElement('input');
    inputNom.type = 'text';
    inputNom.name = 'nomClient';
    inputNom.required = false;
    inputNom.placeholder = 'Nom client (optionnel)';
    labelNom.appendChild(inputNom);
    form.appendChild(labelNom);
    form.appendChild(document.createElement('br'));

    const labelEmail = document.createElement('label');
    labelEmail.textContent = 'Email client: ';
    const inputEmail = document.createElement('input');
    inputEmail.type = 'email';
    inputEmail.name = 'emailClient';
    inputEmail.required = false;
    inputEmail.placeholder = 'Email client (optionnel)';
    labelEmail.appendChild(inputEmail);
    form.appendChild(labelEmail);
    form.appendChild(document.createElement('br'));

    const labelFacture = document.createElement('label');
    const inputFacture = document.createElement('input');
    inputFacture.type = 'checkbox';
    inputFacture.name = 'facture';
    labelFacture.appendChild(inputFacture);
    labelFacture.appendChild(document.createTextNode(' Demander une facture'));
    form.appendChild(labelFacture);
    form.appendChild(document.createElement('br'));
    form.appendChild(document.createElement('br'));

    const btnSubmit = document.createElement('button');
    btnSubmit.type = 'submit';
    btnSubmit.textContent = 'Valider la vente';
    form.appendChild(btnSubmit);

    const btnCancel = document.createElement('button');
    btnCancel.type = 'button';
    btnCancel.textContent = 'Annuler';
    btnCancel.style.marginLeft = '10px';
    btnCancel.onclick = () => {
      document.body.removeChild(popup);
    };
    form.appendChild(btnCancel);

    popup.appendChild(form);
    document.body.appendChild(popup);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nomClient = inputNom.value.trim() || null;
      const emailClient = inputEmail.value.trim() || null;
      const demandeFacture = inputFacture.checked;

      // Build vente object
      const vente = {
        date: new Date().toISOString(),
        caissier: window.user?.nom || 'inconnu',
        client: {
          nom: nomClient,
          email: emailClient
        },
        modePaiement,
        total,
        demandeFacture,
        articles: []
      };

      document.querySelectorAll('.receipt-line').forEach(line => {
        vente.articles.push({
          nom: line.dataset.nom,
          quantite: parseInt(line.dataset.qty || 1)
        });
      });

      try {
        await window.electronAPI.saveVente(vente);
        alert('Vente enregistrée avec succès ✅');

        // Reset ticket
        receiptBody.innerHTML = '';
        total = 0;
        receiptTotal.textContent = '0,00€';

        document.body.removeChild(popup);
      } catch (err) {
        console.error('Erreur lors de la sauvegarde de la vente :', err);
        alert('Erreur lors de l’enregistrement de la vente ❌');
      }
    });
  }
})();