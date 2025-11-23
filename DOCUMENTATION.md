# Dédica'Caisse - Documentation Complète

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture technique](#architecture-technique)
3. [Installation et configuration](#installation-et-configuration)
4. [Structure du projet](#structure-du-projet)
5. [Base de données](#base-de-données)
6. [API IPC (Inter-Process Communication)](#api-ipc)
7. [Fonctionnalités principales](#fonctionnalités-principales)
8. [Gestion des images](#gestion-des-images)
9. [Compilation et déploiement](#compilation-et-déploiement)
10. [Maintenance et dépannage](#maintenance-et-dépannage)

---

## 📖 Vue d'ensemble

**Dédica'Caisse** est une application desktop de point de vente (POS) développée avec Electron pour le Festival Dédica'Marcq, un salon du livre. L'application permet de gérer :

- **Ventes** : Enregistrement des transactions en espèces, chèque et carte bancaire
- **Catalogue** : Gestion des livres et articles par dossiers
- **Facturation** : Génération automatique de factures PDF
- **Email** : Envoi automatique des factures par e-mail
- **Statistiques** : Visualisation des ventes et des performances
- **Scan** : Intégration avec l'app mobile Dédica'Scan pour scanner les code-barres

### Caractéristiques techniques

- **Framework** : Electron 37.0.0
- **Base de données** : MySQL (via mysql2/promise)
- **Génération PDF** : PDFKit
- **Email** : Nodemailer
- **Serveur API** : Express (port 3001)
- **Interface** : HTML5, CSS3, JavaScript vanilla

---

## 🏗️ Architecture technique

### Architecture Electron

```
┌─────────────────────────────────────────────┐
│           Processus Principal               │
│              (main.js)                      │
│  • Gestion fenêtre                          │
│  • Pool MySQL                               │
│  • Serveur Express (:6077)                  │
│  • IPC Handlers                             │
│  • Gestion fichiers/images                  │
└──────────────┬──────────────────────────────┘
               │ IPC Communication
               │ (contextBridge)
┌──────────────┴──────────────────────────────┐
│         Processus de Rendu                  │
│          (preload.js + HTML/JS)             │
│  • Interface utilisateur                    │
│  • Logique métier frontend                  │
│  • API window.api.*                         │
└─────────────────────────────────────────────┘
```

### Isolation de contexte

L'application utilise `contextIsolation: true` pour la sécurité. Toutes les communications entre le rendu et le processus principal passent par `preload.js` via le `contextBridge`.

**Flux de données typique** :
1. UI (HTML/JS) → `window.api.getProduits()`
2. preload.js → `ipcRenderer.invoke('get-produits')`
3. main.js → `ipcMain.handle('get-produits')` → MySQL
4. Retour des données via Promise

---

## 🚀 Installation et configuration

### Prérequis

- **Node.js** : v18 ou supérieur
- **MySQL** : v5.7 ou supérieur
- **npm** : v9 ou supérieur

### Installation

```bash
# Cloner le repository
git clone https://github.com/Dedica-Marcq/Dedica-Caisse.git
cd Dedica-Caisse

# Installer les dépendances
npm install

# Lancer en mode développement
npm start
```

### Configuration de la base de données

Au premier lancement, l'assistant de configuration (`assistant.html`) guide l'utilisateur pour :

1. Configurer la connexion MySQL
2. Tester la connexion
3. Initialiser la structure de la base de données

La configuration est sauvegardée dans :
```
~/Library/Application Support/dedica-caisse/Ressources/config.json  (macOS)
%APPDATA%/dedica-caisse/Ressources/config.json                      (Windows)
~/.config/dedica-caisse/Ressources/config.json                      (Linux)
```

Format du fichier `config.json` :
```json
{
  "host": "localhost",
  "port": 3306,
  "user": "root",
  "password": "password",
  "database": "dedica_caisse"
}
```

---

## 📁 Structure du projet

```
Dedica-Caisse/
├── main.js                 # Processus principal Electron
├── preload.js              # Pont IPC sécurisé
├── menu.js                 # Menu de l'application (macOS)
├── package.json            # Configuration npm et electron-builder
│
├── html/                   # Pages de l'application
│   ├── caisse.html         # Page principale (point de vente)
│   ├── articles.html       # Gestion des livres
│   ├── ventes.html         # Historique des ventes
│   ├── rapport.html        # Statistiques et graphiques
│   ├── dedicascan.html     # Intégration Dédica'Scan
│   ├── assistant.html      # Assistant de configuration
│   └── offline.html        # Page hors connexion
│
├── css/                    # Styles
│   ├── style.css           # Styles principaux
│   ├── articles-ventes.css # Styles articles/ventes
│   ├── assistant.css       # Styles assistant
│   └── dedicascan.css      # Styles Dédica'Scan
│
├── js/                     # Scripts côté rendu
│   ├── vente.js            # Logique de vente
│   ├── articles.js         # Gestion des articles
│   ├── vente_review.js     # Revue des ventes
│   ├── rapport.js          # Génération des stats
│   ├── facture.js          # Génération PDF (processus principal)
│   ├── mail.js             # Envoi d'emails (processus principal)
│   ├── images.js           # Chargement dynamique des images
│   ├── calculatrice.js     # Calculatrice intégrée
│   ├── heure.js            # Affichage de l'horloge
│   └── assistant.js        # Assistant de configuration
│
├── images/                 # Ressources images
│   ├── Logo.png
│   ├── dedica-scan.png
│   ├── qrcode-dedicacaisse.png
│   ├── testflight.png
│   └── offline-icon.png
│
└── out/                    # Builds générés (non versionné)
```

---

## 🗄️ Base de données

### Schéma SQL

#### Table `produits`
```sql
CREATE TABLE produits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(255) NOT NULL,
  code_barre VARCHAR(100),
  dossier VARCHAR(100),
  prix DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  tva DECIMAL(5, 2) NOT NULL DEFAULT 5.50,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_dossier (dossier),
  INDEX idx_code_barre (code_barre)
);
```

#### Table `ventes`
```sql
CREATE TABLE ventes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  total DECIMAL(10, 2) NOT NULL,
  mode_paiement ENUM('espèces', 'chèque', 'carte bleue') NOT NULL,
  date_vente DATETIME NOT NULL,
  nom_client VARCHAR(255),
  email_client VARCHAR(255),
  adresse_client TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_date_vente (date_vente),
  INDEX idx_mode_paiement (mode_paiement)
);
```

#### Table `vente_articles`
```sql
CREATE TABLE vente_articles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vente_id INT NOT NULL,
  article_id INT NOT NULL,
  quantite INT NOT NULL DEFAULT 1,
  FOREIGN KEY (vente_id) REFERENCES ventes(id) ON DELETE CASCADE,
  FOREIGN KEY (article_id) REFERENCES produits(id) ON DELETE RESTRICT,
  INDEX idx_vente (vente_id),
  INDEX idx_article (article_id)
);
```

### Relations

```
ventes (1) ──── (N) vente_articles (N) ──── (1) produits
```

---

## 🔌 API IPC (Inter-Process Communication)

### Produits

#### `get-produits`
Récupère tous les produits triés par dossier et nom.

**Paramètres** : Aucun  
**Retour** : `Array<Produit>`

```javascript
const produits = await window.api.getProduits();
```

#### `add-produit`
Ajoute un nouveau produit.

**Paramètres** : `{ nom, code_barre, dossier, prix, tva }`  
**Retour** : `{ success: boolean, id?: number, error?: string }`

```javascript
const result = await window.api.addProduit({
  nom: "Le Petit Prince",
  code_barre: "9782070612758",
  dossier: "Classiques",
  prix: 12.50,
  tva: 5.5
});
```

#### `update-produit`
Met à jour un produit existant.

**Paramètres** : `{ id, nom, code_barre, dossier, prix, tva }`  
**Retour** : `{ success: boolean, error?: string }`

#### `delete-produit`
Supprime un produit.

**Paramètres** : `id: number`  
**Retour** : `{ success: boolean, error?: string }`

### Ventes

#### `save-vente`
Enregistre une nouvelle vente avec ses articles.

**Paramètres** :
```javascript
{
  client: string,
  email: string,
  adresse: string,
  modePaiement: "espèces" | "chèque" | "carte bleue",
  total: number,
  date: string (ISO 8601),
  articles: Array<{ id, quantite, prix, nom }>
}
```

**Retour** : `{ success: boolean, venteId?: number, error?: string }`

**Gestion des articles inconnus** :
Si un article a un ID commençant par `unknown_`, il sera automatiquement créé en base avant l'insertion de la vente.

```javascript
const result = await window.api.saveVente({
  client: "Jean Dupont",
  email: "jean@example.com",
  adresse: "123 Rue de la Paix, 75001 Paris",
  modePaiement: "carte bleue",
  total: 45.90,
  date: new Date().toISOString(),
  articles: [
    { id: 1, quantite: 2, prix: 15.00, nom: "Livre A" },
    { id: "unknown_123456", quantite: 1, prix: 15.90, nom: "Livre Inconnu" }
  ]
});
```

#### `get-ventes`
Récupère toutes les ventes.

**Paramètres** : Aucun  
**Retour** : `Array<{ id, date_vente, total }>`

#### `get-vente-details`
Récupère les détails d'une vente spécifique.

**Paramètres** : `id: number`  
**Retour** :
```javascript
{
  vente: { id, date_vente, total, nom_client, email_client, adresse_client, mode_paiement },
  items: Array<{ article_id, quantite, nom, prix }>
}
```

### Factures

#### `generate-facture`
Génère une facture PDF pour une vente.

**Paramètres** : `venteId: number`  
**Retour** : `{ success: boolean, result: string (chemin du fichier), error?: string }`

Le fichier PDF est sauvegardé dans :
```
~/Documents/Dedica_Caisse/facture_<venteId>.pdf
```

#### `send-facture`
Envoie une facture par e-mail.

**Paramètres** :
```javascript
{
  to: string (email destinataire),
  pdfPath: string (chemin absolu du PDF)
}
```

**Retour** : `{ success: boolean, info?: object, message?: string }`

```javascript
const result = await window.emailAPI.sendFacture({
  to: "client@example.com",
  pdfPath: "/Users/xxx/Documents/Dedica_Caisse/facture_123.pdf"
});
```

### Configuration

#### `save-db-config`
Sauvegarde la configuration de la base de données.

**Paramètres** : `{ host, port, user, password, database }`  
**Retour** : `{ success: boolean, connected: boolean, error?: string }`

#### `test-db-connection`
Teste une connexion à la base de données.

**Paramètres** : `{ host, port, user, password, database }`  
**Retour** : `{ success: boolean, connected: boolean, error?: string }`

#### `load-db-config`
Charge la configuration sauvegardée.

**Paramètres** : Aucun  
**Retour** : `{ success: boolean, config?: object, error?: string }`

### Navigation

#### `open-caisse`
Charge la page de caisse.

**Retour** : `{ success: boolean }`

#### `open-articles`
Charge la page de gestion des articles.

**Retour** : `{ success: boolean }`

### Images

#### `get-image-path`
Récupère le chemin absolu d'une image depuis `userData/Ressources`.

**Paramètres** : `imageName: string`  
**Retour** : `{ success: boolean, path?: string (file://...), error?: string }`

```javascript
const result = await window.api.getImagePath("Logo.png");
// result.path = "file:///Users/xxx/Library/Application Support/dedica-caisse/Ressources/Logo.png"
```

### Statistiques

#### `get-stats`
Récupère les données pour les graphiques de statistiques.

**Paramètres** : Aucun  
**Retour** :
```javascript
{
  ventes: Array<{ total, mode_paiement }>,
  topArticles: Array<{ nom, quantite }>
}
```

#### `get-rapport`
Récupère un rapport complet des ventes.

**Paramètres** : Aucun  
**Retour** :
```javascript
{
  chiffre_affaires: number,
  panier_moyen: number,
  paiements: Array<{ mode_paiement, montant }>,
  articles: Array<{ nom, total_qte }>
}
```

### Messages / Notifications

#### `send-message`
Diffuse un message à toutes les fenêtres ouvertes.

**Paramètres** : `message: string`  
**Retour** : `{ success: boolean, error?: string }`

**Réception côté rendu** :
```javascript
window.api.receive("new-message", (data) => {
  console.log(data.message, data.timestamp);
});
```

---

## 🎨 Fonctionnalités principales

### 1. Caisse (caisse.html)

**Page principale** où s'effectuent les ventes.

**Fonctionnalités** :
- Affichage des livres par dossiers
- Panier en temps réel
- Calculatrice intégrée
- 3 modes de paiement (espèces, chèque, CB)
- Ajout d'articles inconnus (sans code-barre)
- Génération et envoi de facture

**Workflow** :
1. Sélectionner un dossier (ex: "Poésie")
2. Ajouter des livres au panier
3. Cliquer sur un mode de paiement
4. [Optionnel] Cocher "Générer une facture" et remplir les infos client
5. Confirmer la vente
6. [Optionnel] Télécharger ou envoyer la facture par e-mail

### 2. Gestion des articles (articles.html)

Permet d'ajouter, modifier et supprimer des livres.

**Formulaire** :
- Nom du livre
- Code-barres (optionnel)
- Dossier (ex: "Roman", "Poésie", "BD")
- Prix (€)
- TVA (%)

### 3. Historique des ventes (ventes.html)

Affiche toutes les ventes avec possibilité de voir les détails :
- Date et heure
- Montant total
- Mode de paiement
- Liste des articles vendus
- Informations client (si facture générée)

### 4. Statistiques (rapport.html)

Visualisation des données de vente via Chart.js :
- **Répartition des paiements** (pie chart)
- **Top 5 des articles vendus** (bar chart)
- Chiffre d'affaires total
- Panier moyen

### 5. Dédica'Scan (dedicascan.html)

Page d'information sur l'application mobile Dédica'Scan.

**Intégration technique** :
- Serveur Express sur le port `:3001`
- Endpoint `POST /addProductByBarcode` reçoit `{ barcode }`
- Recherche le produit dans la base MySQL
- Envoie un événement IPC `add-product` au processus de rendu
- Le produit est automatiquement ajouté au panier

**App mobile** → `http://localhost:3001/addProductByBarcode` → main.js → caisse.html

---

## 🖼️ Gestion des images

Les images sont automatiquement copiées dans `userData/Ressources` au démarrage pour garantir leur disponibilité en mode production (app compilée).

### Fonctionnement

**Au démarrage** (`main.js`) :
```javascript
copyResourcesToUserData();
```

Cette fonction :
1. Détecte si l'app est packagée (`app.isPackaged`)
2. Copie les images depuis `process.resourcesPath/images` (prod) ou `__dirname/images` (dev)
3. Vérifie les dates de modification pour éviter les copies inutiles

**Côté rendu** (`images.js`) :
- Recherche tous les éléments avec `data-dynamic-image="<nom>.png"`
- Appelle `window.api.getImagePath()` pour chaque image
- Définit l'attribut `src` avec le chemin `file://...`

### Utilisation dans le HTML

Au lieu de :
```html
<img src="../images/Logo.png" alt="Logo">
```

Utiliser :
```html
<img data-dynamic-image="Logo.png" alt="Logo">
```

Et inclure le script :
```html
<script src="../js/images.js"></script>
```

### Ajouter une nouvelle image

1. Placer l'image dans `images/`
2. Ajouter le nom dans `main.js` :
   ```javascript
   const imagesToCopy = [
     "Logo.png",
     "nouvelle-image.png"  // Ajouter ici
   ];
   ```
3. Utiliser `data-dynamic-image="nouvelle-image.png"` dans le HTML

---

## 📦 Compilation et déploiement

### Scripts npm

```bash
# Développement
npm start

# Build pour toutes les plateformes
npm run dist

# Build macOS uniquement
npm run dist:mac

# Build Windows uniquement
npm run dist:win
```

### Configuration electron-builder

```json
{
  "build": {
    "appId": "com.dedica-marcq.dedica-caisse",
    "productName": "DedicaCaisse",
    "asar": true,
    "extraResources": [
      {
        "from": "images",
        "to": "images",
        "filter": ["**/*"]
      }
    ],
    "mac": {
      "category": "public.app-category.business",
      "target": "dmg"
    },
    "win": {
      "target": "nsis"
    }
  }
}
```

### Emplacements des fichiers après compilation

**macOS** :
```
DedicaCaisse.app/
├── Contents/
│   ├── MacOS/DedicaCaisse        # Exécutable
│   ├── Resources/
│   │   ├── app.asar              # Code de l'application
│   │   └── images/               # Images (extraResources)
```

**Windows** :
```
DedicaCaisse/
├── DedicaCaisse.exe
├── resources/
│   ├── app.asar
│   └── images/
```

### Distribution

**macOS** : Fichier `.dmg` dans `out/`  
**Windows** : Installeur `.exe` dans `out/`

**Notes** :
- Le certificat de signature n'est pas configuré (`identity: null`)
- Pour distribuer sur macOS, il faudra signer l'app avec un certificat Apple Developer
- Pour Windows, signer avec un certificat Authenticode

---

## 🔧 Maintenance et dépannage

### Problèmes courants

#### 1. Erreur de connexion MySQL

**Symptômes** : Page `offline.html` affichée au démarrage

**Solutions** :
- Vérifier que MySQL est démarré
- Vérifier les identifiants dans `config.json`
- Tester la connexion depuis l'assistant

**Logs** :
```bash
# Console Electron (DevTools)
Échec tentative 1/2: <message d'erreur>
```

#### 2. Images ne se chargent pas

**Symptômes** : Images absentes ou icône cassée

**Solutions** :
- Vérifier que les images existent dans `images/`
- Vérifier les logs dans DevTools :
  ```
  Erreur chargement image Logo.png: <erreur>
  ```
- Vérifier que `images.js` est bien inclus dans la page
- Relancer l'app pour recopi er les images

#### 3. Facture ne se génère pas

**Symptômes** : Erreur lors du clic sur "Télécharger la facture"

**Solutions** :
- Vérifier que le dossier `~/Documents/Dedica_Caisse/` existe
- Vérifier les permissions d'écriture
- Vérifier que le logo existe : `~/Documents/Dedica_Caisse/Ressources/Logo.png`

**Logs (Console Electron)** :
```
Erreur génération facture : <message>
```

#### 4. Envoi d'e-mail échoue

**Symptômes** : `ETIMEDOUT` ou erreur SMTP

**Solutions** :
- Le serveur SMTP tente automatiquement les ports 465 et 587
- Vérifier la connexion internet
- Vérifier que le serveur SMTP est accessible
- Vérifier les identifiants dans `js/mail.js`

**Logs** :
```
Échec port 465: <erreur>
Tentative via port 587...
```

### Logs et debugging

**Ouvrir DevTools** :
- Menu Fichier → Show DevTools (en développement)
- `Cmd+Option+I` (macOS) / `Ctrl+Shift+I` (Windows)

**Logs processus principal** :
```bash
# Affichés dans le terminal où npm start a été lancé
console.log() dans main.js apparaît ici
```

**Logs processus de rendu** :
```bash
# Affichés dans DevTools (Console)
console.log() dans vente.js, articles.js, etc. apparaît ici
```

### Réinitialisation

Pour réinitialiser complètement l'application :

```bash
# Supprimer la configuration
rm -rf ~/Library/Application\ Support/dedica-caisse  # macOS
rm -rf %APPDATA%/dedica-caisse                      # Windows
rm -rf ~/.config/dedica-caisse                      # Linux

# Relancer l'app
npm start
```

### Base de données : Sauvegarde

```bash
# Export complet
mysqldump -u root -p dedica_caisse > backup_$(date +%Y%m%d).sql

# Restauration
mysql -u root -p dedica_caisse < backup_20250123.sql
```

### Performance

**Pool de connexions MySQL** :
- Limite : 10 connexions simultanées (`connectionLimit: 10`)
- Si besoin, augmenter dans `main.js`

**Mémoire Electron** :
- Utilisation typique : 150-200 MB
- Surveillance : DevTools → Memory

---

## 📞 Support et contribution

**Auteur** : Basile BARGIBANT  
**Email** : webmaster@dedica-marcq.com  
**Repository** : [github.com/Dedica-Marcq/Dedica-Caisse](https://github.com/Dedica-Marcq/Dedica-Caisse)

### Contribuer

1. Fork le repository
2. Créer une branche (`git checkout -b feature/ma-fonctionnalité`)
3. Commit les changements (`git commit -m 'Ajout de...'`)
4. Push vers la branche (`git push origin feature/ma-fonctionnalité`)
5. Ouvrir une Pull Request

---

## 📄 Licence

Ce projet est sous licence **UNLICENSED** - usage strictement réservé au Festival Dédica'Marcq.

---

## 📚 Ressources additionnelles

- [Electron Documentation](https://www.electronjs.org/docs)
- [electron-builder](https://www.electron.build/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [PDFKit Documentation](https://pdfkit.org/)
- [Nodemailer Documentation](https://nodemailer.com/)
- [Chart.js Documentation](https://www.chartjs.org/)

---

**Version du document** : 1.0.0  
**Dernière mise à jour** : 23 novembre 2025
