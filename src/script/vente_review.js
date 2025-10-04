document.addEventListener('DOMContentLoaded', () => {
  const ventesList = document.getElementById('ventes-list');
  const venteDetails = document.getElementById('details');
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

  // Normalisation des formats de date
  const normalizeDate = (input) => {
    if (!input) return '—';
    
    const d = new Date(input);
    if (!isNaN(d.getTime())) return formatFR(d);

    const m = /^(\d{2})-(\d{2})-(\d{4})[\/ ](\d{2})-(\d{2})-(\d{2})$/.exec(String(input));
    if (m) {
      const [, DD, MM, YYYY, hh, mm, ss] = m;
      const iso = `${YYYY}-${MM}-${DD}T${hh}:${mm}:${ss}`;
      const d2 = new Date(iso);
      return !isNaN(d2.getTime()) ? formatFR(d2) : `${DD}/${MM}/${YYYY} ${hh}:${mm}`;
    }

    return String(input);
  };

  // --- Chargement de la liste des ventes ---
  async function loadVentes() {
    try {
      const ventes = await window.api.getVentes();
      ventesList.innerHTML = '';

      if (!ventes || ventes.length === 0) {
        ventesList.innerHTML = '<p class="empty">Aucune vente</p>';
        return;
      }

      ventes.forEach((v) => {
        const total = Number(v.total ?? 0);
        const btn = document.createElement('button');
        btn.className = 'vente-item';
        btn.innerHTML = `
          <span class="vente-id">#${v.id}</span>
          <span class="vente-date">${normalizeDate(v.date_vente)}</span>
          <span class="vente-total">${euro(total)}</span>
        `;
        btn.addEventListener('click', () => loadVenteDetails(v.id));
        ventesList.appendChild(btn);
      });
    } catch (err) {
      console.error(err);
      ventesList.innerHTML = '<p class="empty">Erreur lors du chargement des ventes.</p>';
    }
  }

  // --- Détails d’une vente ---
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

      // Génération du tableau des articles
      const rows = items.length > 0
        ? items.map((it) => {
            const prix = Number(it.prix ?? 0);
            const prixAchat = Number(it.prix_achat ?? 0);
            const marge = prix - prixAchat;
            const qte = Number(it.quantite ?? 0);
            const nom = it.nom ?? `#${it.produit_id ?? ''}`;
            const lineTotal = prix * qte;

            return `
              <tr>
                <td>${nom}</td>
                <td>${qte}</td>
                <td>${euro(prix)}</td>
                <td>${euro(marge)}</td>
                <td>${euro(lineTotal)}</td>
              </tr>
            `;
          }).join('')
        : `<tr><td colspan="5" class="empty">Aucun article</td></tr>`;

      // Contenu principal
      venteDetails.innerHTML = `
        <div class="vente-header">
          <div class="infos">
            <h3>Vente #${v.id}</h3>
            <div class="meta">
              <div><strong>Date :</strong> ${normalizeDate(v.date_vente)}</div>
              <div><strong>Client :</strong> ${v.nom_client ?? '—'}</div>
              <div><strong>Paiement :</strong> ${v.mode_paiement ?? '—'}</div>
            </div>
          </div>
          <div class="total">${euro(totalVente)}</div>
        </div>

        <table class="vente-table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Qté</th>
              <th>Prix</th>
              <th>Marge</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <div class="facture-download">
          <button id="download-facture-btn" class="button-primary">
            <i class="bi bi-receipt"></i> Télécharger la facture
          </button>
        </div>
      `;

      const btnFacture = document.getElementById('download-facture-btn');
      btnFacture.addEventListener('click', async () => {
        try {
          await window.api.generateFacture(id);
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

  // --- Événements ---
  document.getElementById('btn-refresh')?.addEventListener('click', loadVentes);

  // Chargement initial
  loadVentes();
});
