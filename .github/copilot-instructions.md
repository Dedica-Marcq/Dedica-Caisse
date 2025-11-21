# Dédica'Caisse • Règles pour agents IA

Ces instructions rendent un agent immédiatement productif dans ce repo Electron (caisse, ventes, articles, rapports, factures PDF + envoi e‑mail).

## Vue d’ensemble
- App desktop **Electron**: `main.js` (processus principal) + pages HTML statiques dans `html/` et JS côté rendu dans `js/`.
- **Isolation de contexte activée**: aucun accès Node côté rendu. Toute interaction passe par `preload.js` via `window.api` / `window.emailAPI`.
- Données persistées en **MySQL** (mysql2/promise). Génération de **PDF** via `pdfkit`. Envoi d’e‑mail via **nodemailer**.
- Mini serveur **Express** sur `:3001` pour Dédica'Scan (ajout d’articles par code‑barres) qui notifie le rendu via `ipcRenderer`.

## Flux et frontières
- Démarrage: `main.js` vérifie la BDD (`isDBConnected`) et charge soit `html/caisse.html`, soit `html/offline.html`. Re‑bascule auto toutes les 15s.
- Rendu -> Principal: appels `ipcMain.handle(...)` exposés par `preload.js`:
  - Produits: `get-produits`, `add-produit`, `update-produit`, `delete-produit`.
  - Ventes: `save-vente`, `get-ventes`, `get-vente-details`, `generate-facture`.
  - Rapports: `get-stats` (agrégats pour Chart.js).
  - Email: `send-facture` (via `window.emailAPI`).
- Principal -> Rendu: events `webContents.send(...)` (ex: `add-product` depuis `/addProductByBarcode`). Abonné côté rendu via `window.api.receive(channel, cb)`.

## Conventions du projet
- UI: pages dans `html/` + styles `css/` + scripts dans `js/`. Exemple: `caisse.html` utilise `js/vente.js`.
- Pas de Node direct dans le DOM: utiliser `window.api.*` défini dans `preload.js`.
- Format monétaire/affichage: voir helpers dans `js/vente.js` et `js/vente_review.js` (format FR, `euro(val)`).
- Génération facture: `js/facture.js` écrit vers `~/Documents/Dedica_Caisse/facture_<id>.pdf` et utilise un logo attendu sous `~/Documents/Dedica_Caisse/Ressources/Logo.png`.
- Rapports: `html/rapport.html` charge Chart.js via CDN, données via `window.api.getStats()` et rendu dans `js/rapport.js`.
- Menu et navigation: `menu.js` charge des fichiers `html/*.html` (pas de router SPA).

## Base de données (schéma et usage)
- Tables: `produits`, `ventes`, `vente_articles` (voir README.md pour DDL). Accès via `pool.execute(...)` avec requêtes SQL explicites.
- `save-vente` insère vente + lignes (quantité, prix tirés de `produits`).
- `get-vente-details` joint `vente_articles` ↔ `produits` pour l’affichage.

## Workflows dev et build
- Développement: `npm start` (ouvre Electron avec DevTools via menu « Fichier → Show DevTools »).
- Packaging: `npm run dist:mac|dist:win|dist:linux` (electron‑builder). Artefacts dans `out/`. ASAR activé.
- Ressources de build: `assets/` inclus via `extraResources`. Exclusions listées dans `build.files` de `package.json`.

## Ajouter une fonctionnalité (pattern recommandé)
1) Définir le handler côté principal (`main.js`):
```js
ipcMain.handle("get-foo", async (e, id) => { /* SQL/FS */ return { ok: true, data }; });
```
2) L’exposer dans `preload.js`:
```js
contextBridge.exposeInMainWorld("api", { getFoo: (id) => ipcRenderer.invoke("get-foo", id), /* ... */ });
```
3) L’utiliser côté rendu (ex: `js/ma_page.js`):
```js
const data = await window.api.getFoo(123);
```
4) Naviguer via `menu.js` ou `<a href="...">` vers la page `html/...` si besoin.

## Points d’attention
- Côté rendu, ne pas utiliser `require()` ni accès direct FS/NET: passer par `preload.js`.
- Les identifiants SMTP et MySQL sont codés en dur dans `main.js` / `js/mail.js`. Toute modification doit rester cohérente avec ces fichiers.
- Le serveur Express écoute en permanence le port `3001`. La route `POST /addProductByBarcode` attend `{ barcode }`.
- Facture: certains boutons de génération/envoi sont affichés/masqués dynamiquement après `save-vente` (voir `js/vente.js`).

## Fichiers clés à consulter
- `main.js`, `preload.js`, `menu.js` — structure Electron et IPC
- `js/vente.js`, `js/articles.js`, `js/vente_review.js`, `js/rapport.js` — logiques UI
- `js/facture.js`, `js/mail.js` — génération PDF + envoi e‑mail
- `html/*.html`, `css/*.css` — structure UI et styles
- `package.json`, `README.md` — scripts et packaging
