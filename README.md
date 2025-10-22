

# 💰 Dédica'Caisse

**Dédica'Caisse** est un logiciel de caisse complet développé avec **Electron.js**, **MySQL**, et **Node.js**.  
Conçu pour les événements comme le *Salon du Livre Dédica'Marcq*, il permet la gestion des ventes, des produits, et la génération automatique de **factures PDF** avec possibilité d’envoi par **e-mail**.

---

## 🚀 Fonctionnalités principales

### 💼 Gestion des ventes
- Création et suivi des ventes.
- Association des articles achetés à chaque vente.
- Détails complets du client (nom, e-mail, adresse, mode de paiement).
- Calcul automatique des **marges** et des **totaux TTC / HT / TVA**.

### 🧾 Facturation
- Génération automatique d’une facture PDF.
- Enregistrement automatique dans `~/Documents/Dedica_Caisse/`.
- Ouverture automatique de la facture après génération.
- Envoi direct par **e-mail** au client (SMTP sécurisé).

### 🗂 Gestion des produits
- Affichage de tous les produits de la base MySQL.
- Modification en direct (nom, prix, stock, dossier, TVA, etc.).
- Organisation par **dossiers d’articles**.
- Ajout et suppression d’articles facilement.

### 📊 Base de données MySQL
#### Tables :
- **produits** → gestion du stock et des informations articles.  
- **ventes** → enregistrement des ventes (client, date, total, paiement).  
- **vente_articles** → lien entre les ventes et les produits (quantité, prix).  

---

## ⚙️ Installation

### 1️⃣ Cloner le projet
```bash
git clone https://github.com/Dedica-Marcq/Dedica-Caisse.git
cd Dedica-Caisse
```

### 2️⃣ Installer les dépendances
```bash
npm install
```

### 3️⃣ Configurer la base de données
Crée une base **dedica_caisse** et exécute le script SQL fourni pour générer les tables :
```sql
CREATE TABLE produits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(255),
  code_barre VARCHAR(255),
  stock INT DEFAULT 0,
  rayon VARCHAR(255),
  dossier VARCHAR(255),
  prix DECIMAL(10,2),
  prix_achat DECIMAL(10,2),
  tva DECIMAL(4,2)
);

CREATE TABLE ventes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom_client VARCHAR(255),
  email_client VARCHAR(255),
  adresse_client VARCHAR(255),
  mode_paiement VARCHAR(100),
  total DECIMAL(10,2),
  date_vente DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vente_articles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vente_id INT,
  article_id INT,
  quantite INT,
  FOREIGN KEY (vente_id) REFERENCES ventes(id),
  FOREIGN KEY (article_id) REFERENCES produits(id)
);
```

Configure les informations de connexion MySQL dans `main.js`.

---

## 💻 Lancer l’application

### En mode développement :
```bash
npm start
```

### Compiler pour distribution :
- **macOS :**
  ```bash
  npm run dist:mac
  ```
- **Windows :**
  ```bash
  npm run dist:win
  ```
- **Linux :**
  ```bash
  npm run dist:linux
  ```

Les exécutables seront générés dans le dossier `dist/`.

---

## 📧 Envoi des factures par e-mail

L’application utilise le protocole **SMTP sécurisé (SSL/TLS)** pour envoyer les factures PDF.

### Exemple de configuration :
```js
const smtp = {
  host: "mail.dedica-marcq.com",
  port: 465,
  secure: true,
  user: "webmaster@dedica-marcq.com",
  pass: "VOTRE_MOT_DE_PASSE"
};
```

---

## 🧠 Technologies utilisées

| Technologie | Rôle |
|-------------|------|
| **Electron.js** | Interface de bureau multiplateforme |
| **Node.js** | Backend et génération des factures |
| **MySQL** | Base de données principale |
| **PDFKit** | Génération des factures PDF |
| **Nodemailer** | Envoi des factures par e-mail |
| **Bootstrap Icons** | Icônes et design |
| **HTML / CSS / JS** | Interface utilisateur |

---

## 🛠️ Développement

### Structure du projet
```
Dedica-Caisse/
├── main.js                # Processus principal Electron
├── preload.js             # Bridge entre frontend et backend
├── /src/
│   ├── /script/           # Scripts JS (facture, ventes, articles…)
│   ├── /style/            # Feuilles CSS
│   └── /images/           # Logos et icônes
├── package.json
├── README.md
└── dist/                  # Fichiers compilés (auto-générés)
```

---

## 🧾 Licence

© 2025 **Basile Bargibant** — Tous droits réservés.  
Projet créé pour le **Salon du Livre Dédica'Marcq**.
