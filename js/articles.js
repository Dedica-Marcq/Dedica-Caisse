window.addEventListener("DOMContentLoaded", async () => {
  const dossierList = document.getElementById("dossier-list"); // conteneur dans .sidebar
  const articleDetails = document.getElementById("details"); // conteneur dans .details
  const btnAdd = document.getElementById("btn-add-article"); // bouton principal "Ajouter"

  let produits = [];

  try {
    produits = await window.api.getProduits();

    // Extraire les dossiers uniques
    const dossiers = [...new Set(produits.map(p => p.dossier || "Sans dossier"))];

    // Afficher les dossiers dans la sidebar
    dossierList.innerHTML = "";
    const listContainer = document.createElement("div");
    listContainer.className = "button-list";
    dossierList.appendChild(listContainer);

    dossiers.forEach(d => {
      const btn = document.createElement("button");
      btn.className = "button-list-item";
      btn.textContent = d;
      btn.onclick = () => showArticles(d);
      listContainer.appendChild(btn);
    });

    // Gestion du bouton Ajouter
    btnAdd.onclick = () => {
      articleDetails.innerHTML = `
        <h3>Nouvel article</h3>
        <div class="form-section">
          <label>Nom :</label>
          <input type="text" id="new-nom" placeholder="Nom" required>
          
          <label>Code-barre :</label>
          <input type="text" id="new-code" placeholder="Code-barre" required>
          
          <label>Prix :</label>
          <input type="number" step="0.01" id="new-prix" placeholder="Prix" required>
          
          <label>TVA (%)</label>
          <input type="number" step="0.01" min="0" max="100" id="new-tva" placeholder="TVA" required>
          
          <label>Auteur :</label>
          <input type="text" id="new-dossier" placeholder="Auteur" required>
        </div>
        <button id="create-article" class="button-primary"><i class="bi bi-plus-circle"></i> Créer</button>
      `;

      document.getElementById("create-article").onclick = async () => {
        const newArticle = {
          nom: document.getElementById("new-nom").value,
          code_barre: document.getElementById("new-code").value,
          prix: parseFloat(document.getElementById("new-prix").value),
          tva: parseFloat(document.getElementById("new-tva").value),
          dossier: document.getElementById("new-dossier").value || "Sans dossier"
        };

        await window.api.addProduit(newArticle);
        alert("Article ajouté !");
        location.reload();
      };
    };

    /***************************************/
    /* Affichage des articles d’un dossier */
    /************************************/
    function showArticles(dossier) {
      dossierList.innerHTML = "";

      const backBtn = document.createElement("button");
      backBtn.className = "button-primary";
      backBtn.innerHTML = `<i class="bi bi-arrow-left"></i> Retour`;
      backBtn.onclick = () => location.reload();
      dossierList.appendChild(backBtn);

      const listContainer = document.createElement("div");
      listContainer.className = "button-list";
      dossierList.appendChild(listContainer);

      const filtered = produits.filter(p => (p.dossier || "Sans dossier") === dossier);

      filtered.forEach(article => {
        const btn = document.createElement("button");
        btn.className = "button-list-item";
        btn.textContent = `${article.nom}`;
        btn.onclick = () => showDetails(article);
        listContainer.appendChild(btn);
      });
    }

    /************************************/
    /* Détails d’un article */
    /************************************/
    function showDetails(article) {
      articleDetails.innerHTML = `
        <h3>${article.nom}</h3>
        <div class="form-section">
          <label>Nom :</label>
          <input type="text" id="edit-nom" value="${article.nom}" required>
          
          <label>Code-barre :</label>
          <input type="text" id="edit-code" value="${article.code_barre || ""}" required>
          
          <label>Prix :</label>
          <input type="number" step="0.01" id="edit-prix" value="${article.prix}" required>

          <label for="tva">TVA (%)</label>
          <input type="number" id="tva" step="0.01" min="0" max="100" value="${article.tva !== undefined ? article.tva : 0}" required>
          
          <label>Dossier :</label>
          <input type="text" id="edit-dossier" value="${article.dossier || "Sans dossier"}" required>
        </div>
        <button id="save-article" class="button-primary"><i class="bi bi-floppy"></i> Enregistrer</button>
      `;

      document.getElementById("save-article").onclick = async () => {
        const updated = {
          id: article.id,
          nom: document.getElementById("edit-nom").value,
          code_barre: document.getElementById("edit-code").value,
          prix: parseFloat(document.getElementById("edit-prix").value),
          tva: parseFloat(document.getElementById("tva").value),
          dossier: document.getElementById("edit-dossier").value
        };

        await window.api.updateProduit(updated);
        alert("Article mis à jour !");
        location.reload();
      };
    }
  } catch (err) {
    console.error("Erreur chargement produits:", err);
    articleDetails.innerHTML = `<p style="color:red;">Erreur de chargement des articles.</p>`;
  }
});