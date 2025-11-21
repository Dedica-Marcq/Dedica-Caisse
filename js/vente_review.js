document.addEventListener('DOMContentLoaded', () => {
  const ventesList = document.getElementById('ventes-list');
  const venteDetails = document.getElementById('details');
  const euro = (val) => `${Number(val || 0).toFixed(2).replace('.', ',')}€`;

  const formatFR = (d) =>
    d.toLocaleString("fr-FR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });

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

      const rows = items.length > 0
        ? items.map((it) => {
            const prix = Number(it.prix ?? 0);
            const qte = Number(it.quantite ?? 0);
            const nom = it.nom ?? `#${it.produit_id ?? ''}`;
            const lineTotal = prix * qte;

            return `
              <tr>
                <td>${nom}</td>
                <td>${qte}</td>
                <td>${euro(prix)}</td>
                <td>${euro(lineTotal)}</td>
              </tr>
            `;
          }).join('')
        : `<tr><td colspan="4" class="empty">Aucun article</td></tr>`;

      venteDetails.innerHTML = `
        <div class="vente-header">
          <div class="infos">
            <h3>Vente #${v.id}</h3>
            <div class="meta">
              <div><strong>Date :</strong> ${normalizeDate(v.date_vente)}</div>
              <div><strong>Client :</strong> ${v.nom_client ?? '—'}</div>
              <div><strong>Mail :</strong> ${v.email_client ?? '—'}</div>
              <div><strong>Adresse :</strong> ${v.adresse_client ?? '—'}</div>
              <div><strong>Paiement :</strong> ${v.mode_paiement ?? '—'}</div>
            </div>
          </div>
          <div class="total">${euro(totalVente)}</div>
        </div>

        <div class="vente-table-container">
          <table class="vente-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Qté</th>
                <th>Prix</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>

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

      const factureContainer = document.querySelector('.facture-download');
      const btnSend = document.createElement('button');
      btnSend.id = 'send-facture-btn';
      btnSend.innerHTML = '<i class="bi bi-send"></i> Envoyer la facture';
      factureContainer.appendChild(btnSend);

      const popupHTML = `
        <div id="email-popup" class="popup" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); align-items:center; justify-content:center;">
          <div class="popup-content" style="background:white; padding:20px; border-radius:10px; width:300px; text-align:center;">
            <h3>Envoyer la facture</h3>
            <label for="email-input">Adresse e-mail du client :</label>
            <input type="email" id="email-input" placeholder="exemple@client.com" style="width:100%; margin:10px 0; padding:5px;" />
            <div class="popup-buttons" style="display:flex; justify-content:space-around;">
              <button id="email-cancel">Annuler</button>
              <button id="email-send">Envoyer</button>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', popupHTML);

      btnSend.addEventListener('click', () => {
        const popup = document.getElementById('email-popup');
        const input = document.getElementById('email-input');
        popup.style.display = 'flex';

        // 💡 Préremplir l'adresse du client
        input.value = v.email_client && v.email_client !== '—' ? v.email_client : '';
        input.focus();

        const sendBtn = document.getElementById('email-send');
        const cancelBtn = document.getElementById('email-cancel');
        const closePopup = () => popup.style.display = 'none';

        cancelBtn.onclick = closePopup;
        sendBtn.onclick = async () => {
          const to = input.value.trim();
          if (!to) {
            alert("Veuillez saisir une adresse e-mail.");
            return;
          }

          closePopup();

          const pdfPath = `/Users/basile/Documents/Dedica_Caisse/facture_${id}.pdf`;

          try {
            const result = await window.emailAPI.sendFacture({
              to,
              subject: "Facture Dédica'Marcq",
              pdfPath
            });

            alert(result.success ? "✅ Facture envoyée avec succès" : "❌ " + result.message);
          } catch (err) {
            console.error("Erreur lors de l’envoi de la facture :", err);
            alert("❌ Une erreur est survenue lors de l’envoi de la facture.");
          }
        };
      });
    } catch (err) {
      console.error(err);
      venteDetails.innerHTML = '<p>Erreur lors du chargement des détails.</p>';
    }
  }

  document.getElementById('btn-refresh')?.addEventListener('click', loadVentes);
  loadVentes();
});
