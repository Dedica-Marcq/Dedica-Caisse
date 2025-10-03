document.addEventListener('DOMContentLoaded', () => {
  const ventesList = document.getElementById('ventes-list');
  const venteDetails = document.getElementById('vente-details');

  // Helpers
  const euro = (val) => `${Number(val || 0).toFixed(2).replace('.', ',')}€`;

  // Formatte toujours en "JJ/MM/AAAA HH:mm"
  const formatFR = (d) =>
    d.toLocaleString("fr-FR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });

// Fonction d'affichage de date (normalisation des formats)
  const normalizeDate = (input) => {
    if (!input) return '—';

    const d = new Date(input);
    if (!isNaN(d.getTime())) return formatFR(d);

    const m = /^(\d{2})-(\d{2})-(\d{4})[\/ ](\d{2})-(\d{2})-(\d{2})$/.exec(String(input));
    if (m) {
      const [, DD, MM, YYYY, hh, mm, ss] = m;
      const iso = `${YYYY}-${MM}-${DD}T${hh}:${mm}:${ss}`;
      const d2 = new Date(iso);
      if (!isNaN(d2.getTime())) return formatFR(d2);
      return `${DD}/${MM}/${YYYY} ${hh}:${mm}`;
    }

    return String(input);
  };
//
  async function loadVentes() {
    try {
      const ventes = await window.api.getVentes();
      ventesList.innerHTML = '';

      if (!ventes || ventes.length === 0) {
        ventesList.innerHTML = '<li class="empty">Aucune vente</li>';
        return;
      }

      ventes.forEach((v) => {
        const total = Number(v.total ?? 0);
        const li = document.createElement('li');
        li.className = 'vente-item';
        li.dataset.id = v.id;
        li.innerHTML = `
          <span>Vente n°</span>
          <span class="vente-id">${v.id} |</span>
          <span class="vente-date">${normalizeDate(v.date_vente)} |</span>
          <span class="vente-total">${euro(total)}</span>
        `;
        li.addEventListener('click', () => loadVenteDetails(v.id));
        ventesList.appendChild(li);
      });
    } catch (err) {
      console.error(err);
      ventesList.innerHTML = '<li class="empty">Erreur lors du chargement</li>';
    }
  }

  async function loadVenteDetails(id) {
    try {
      const data = await window.api.getVenteDetails(id);
      if (!data || !data.vente) {
        venteDetails.innerHTML = '<p>Détails introuvables.</p>';
        return;
      }

      const v = data.vente;
      const items = Array.isArray(data.items) ? data.items : [];
      const totalVente = Number(v.total ?? 0);

      let rows = items.map((it) => {
        const prix = Number(it.prix ?? 0);
        const prixAchat = Number(it.prix_achat ?? 0);
        const marge = prix - prixAchat;
        const qte = Number(it.quantite ?? 0);
        const nom = it.nom ?? `#${it.produit_id ?? ''}`;
        const lineTotal = prix * qte;

        return `
            <tr>
              <td class="col-produit">${nom}</td>
              <td class="col-qty">${qte}</td>
              <td class="col-prix">${euro(prix)}</td>
              <td class="col-marge">${euro(marge)}</td>
              <td class="col-total">${euro(lineTotal)}</td>
            </tr>
        `;
      }).join('');

      if (rows === '') {
        rows = `<tr><td colspan="5" class="empty">Aucun article</td></tr>`;
      }

      venteDetails.innerHTML = `
        <div class="vente-header">
          <div class="infos">
            <h3>Vente #${v.id}</h3>
            <div class="meta">
              <div>Date : ${normalizeDate(v.date_vente)}</div>
              <div>Client : ${v.nom_client ?? '—'}</div>
              <div>Paiement : ${v.mode_paiement ?? '—'}</div>
            </div>
          </div>
          <div class="total">${euro(totalVente)}</div>
        </div>

        <table class="vente-table">
          <thead>
            <tr>
              <th class="col-produit">Produit</th>
              <th class="col-qty">Qté</th>
              <th class="col-prix">Prix</th>
              <th class="col-marge">Marge</th>
              <th class="col-total">Total</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <div class="facture-downlaod">
          <button id="download-facture-btn" class="button"><i class="bi bi-receipt"></i> Télécharger la facture</button>
        </div>
      `;

      const btnFacture = document.getElementById('download-facture-btn');
      btnFacture.addEventListener('click', async () => {
        try {
          const result = await window.api.generateFacture(id);
          console.log('Facture générée:', result);
          alert('Facture générée avec succès.');
        } catch (error) {
          console.error('Erreur lors de la génération de la facture:', error);
          alert('Erreur lors de la génération de la facture.');
        }
      });
    } catch (err) {
      console.error(err);
      venteDetails.innerHTML = '<p>Erreur lors du chargement des détails.</p>';
    }
  }

  loadVentes();
});
