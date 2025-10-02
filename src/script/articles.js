window.addEventListener("DOMContentLoaded", async () => {
  const dossierList = document.getElementById("dossier-list");
  const articleDetails = document.getElementById("article-details");
  const btnAdd = document.getElementById("btn-add-article");

  let produits = [];

  try {
    produits = await window.api.getProduits();

    // Extraire les dossiers uniques
    const dossiers = [...new Set(produits.map(p => p.dossier || "Sans dossier"))];

    // Afficher dossiers
    dossierList.innerHTML = "";
    dossiers.forEach(d => {
      const btn = document.createElement("button");
      btn.className = "button-article";
      btn.textContent = d;
      btn.onclick = () => showArticles(d);
      dossierList.appendChild(btn);
    });

    function showArticles(dossier) {
      dossierList.innerHTML = "";

      // bouton retour
      const backBtn = document.createElement("button");
      backBtn.className = "button-article";
      backBtn.textContent = "← Retour";
      backBtn.onclick = () => location.reload();
      dossierList.appendChild(backBtn);

      const filtered = produits.filter(p => (p.dossier || "Sans dossier") === dossier);

      filtered.forEach(article => {
        const btn = document.createElement("button");
        btn.className = "button-article";
        btn.textContent = `${article.nom}`;
        btn.onclick = () => showDetails(article);
        dossierList.appendChild(btn);
      });
    }

    function showDetails(article) {
      articleDetails.innerHTML = `
        <h4>${article.nom}</h4>
        <label>Nom :</label>
        <input type="text" id="edit-nom" value="${article.nom}">
        
        <label>Description :</label>
        <input type="text" id="edit-description" value="${article.description || ""}">
        
        <label>Code-barre :</label>
        <input type="text" id="edit-code" value="${article.code_barre || ""}">
        
        <label>Stock :</label>
        <input type="number" id="edit-stock" value="${article.stock}">
        
        <label>Prix :</label>
        <input type="number" step="0.01" id="edit-prix" value="${article.prix}">
        
        <label>Prix d’achat :</label>
        <input type="number" step="0.01" id="edit-prix-achat" value="${article.prix_achat}">
        
        <label>Dossier :</label>
        <input type="text" id="edit-dossier" value="${article.dossier || "Sans dossier"}">
        
        <button id="save-article" class="button-article">💾 Enregistrer</button>
      `;

      document.getElementById("save-article").onclick = async () => {
        const updated = {
          id: article.id,
          nom: document.getElementById("edit-nom").value,
          description: document.getElementById("edit-description").value,
          code_barre: document.getElementById("edit-code").value,
          stock: parseInt(document.getElementById("edit-stock").value),
          prix: parseFloat(document.getElementById("edit-prix").value),
          prix_achat: parseFloat(document.getElementById("edit-prix-achat").value),
          dossier: document.getElementById("edit-dossier").value
        };

        await window.api.updateProduit(updated);
        alert("Article mis à jour !");
        location.reload();
      };
    }

    btnAdd.onclick = () => {
      articleDetails.innerHTML = `
        <h4>Nouvel article</h4>
        <input type="text" id="new-nom" placeholder="Nom">
        <input type="text" id="new-description" placeholder="Description">
        <input type="text" id="new-code" placeholder="Code-barre">
        <input type="number" id="new-stock" placeholder="Stock">
        <input type="number" step="0.01" id="new-prix" placeholder="Prix">
        <input type="number" step="0.01" id="new-prix-achat" placeholder="Prix d’achat">
        <input type="text" id="new-dossier" placeholder="Dossier">
        <button id="create-article" class="button-article">Créer</button>
      `;

      document.getElementById("create-article").onclick = async () => {
        const newArticle = {
          nom: document.getElementById("new-nom").value,
          description: document.getElementById("new-description").value,
          code_barre: document.getElementById("new-code").value,
          stock: parseInt(document.getElementById("new-stock").value),
          prix: parseFloat(document.getElementById("new-prix").value),
          prix_achat: parseFloat(document.getElementById("new-prix-achat").value),
          dossier: document.getElementById("new-dossier").value || "Sans dossier"
        };

        await window.api.addProduit(newArticle);
        alert("Article ajouté !");
        location.reload();
      };
    };
  } catch (err) {
    console.error("Erreur chargement produits:", err);
    articleDetails.innerHTML = "<p style='color:red;'>Erreur de chargement des articles.</p>";
  }
});