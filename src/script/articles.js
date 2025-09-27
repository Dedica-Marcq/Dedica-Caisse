window.addEventListener("DOMContentLoaded", async () => {
  const browserList = document.getElementById("browser-list");
  const detailsPanel = document.getElementById("details-panel");

  if (!browserList || !detailsPanel) {
    console.error("Required elements not found in the DOM.");
    return;
  }

  try {
    // Récupérer tous les produits
    const produits = await window.api.getProduits();

    // Extraire la liste des dossiers uniques
    const dossiers = [...new Set(produits.map(p => p.dossier || "Sans dossier"))];

    // Afficher la liste des dossiers
    dossiers.forEach(d => {
      const btn = document.createElement("button");
      btn.textContent = d;
      btn.onclick = () => showArticles(d);
      browserList.appendChild(btn);
    });

    function showArticles(dossier) {
      browserList.innerHTML = "";
      const filtered = produits.filter(p => (p.dossier || "Sans dossier") === dossier);

      filtered.forEach(article => {
        const btn = document.createElement("button");
        btn.textContent = `${article.nom} (${article.prix}€)`;
        btn.onclick = () => showDetails(article);
        browserList.appendChild(btn);
      });
    }

    function showDetails(article) {
      detailsPanel.innerHTML = `
        <h4>${article.nom}</h4>
        <p><strong>Description :</strong> ${article.description || "—"}</p>
        <p><strong>Code-barre :</strong> ${article.code_barre || "—"}</p>
        <p><strong>Stock :</strong> ${article.stock}</p>
        <p><strong>Prix :</strong> ${article.prix} €</p>
        <p><strong>Prix d’achat :</strong> ${article.prix_achat} €</p>
        <p><strong>Dossier :</strong> ${article.dossier || "Sans dossier"}</p>
      `;
    }
  } catch (err) {
    console.error("Erreur chargement produits:", err);
    detailsPanel.innerHTML = "<p style='color:red;'>Erreur de chargement des articles.</p>";
  }
});
