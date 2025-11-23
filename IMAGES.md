# Gestion des Images - Dédica'Caisse

## 📋 Vue d'ensemble

Les images de l'application sont automatiquement copiées dans `userData/Ressources` au démarrage pour garantir leur disponibilité en mode développement et production (app compilée).

## 🔧 Fonctionnement

### 1. Copie automatique au démarrage
Au lancement de l'application (`main.js`), la fonction `copyResourcesToUserData()` :
- Crée le dossier `userData/Ressources` si nécessaire
- Copie les images depuis `images/` vers `userData/Ressources/`
- Met à jour uniquement les fichiers modifiés (compare les dates)

### 2. Accès aux images
Les images sont accessibles via :
- **IPC Handler** : `get-image-path` dans `main.js`
- **Preload** : `window.api.getImagePath(imageName)`
- **Helper JS** : `js/images.js` pour le chargement automatique

### 3. Utilisation dans le HTML
Remplacer :
```html
<img src="../images/Logo.png" alt="Logo">
```

Par :
```html
<img data-dynamic-image="Logo.png" alt="Logo">
```

Puis inclure le script :
```html
<script src="../js/images.js"></script>
```

## 📂 Structure des fichiers

```
Dédica-Caisse/
├── images/                          # Images sources (dev)
│   ├── Logo.png
│   ├── dedica-scan.png
│   ├── qrcode-dedicacaisse.png
│   └── testflight.png
├── js/
│   └── images.js                    # Helper de chargement dynamique
└── [userData]/Ressources/           # Images copiées (runtime)
    ├── Logo.png
    ├── dedica-scan.png
    ├── qrcode-dedicacaisse.png
    └── testflight.png
```

## 🎯 Avantages

✅ **En développement** : Utilise les images locales du dossier `images/`
✅ **En production** : Utilise les images copiées dans `userData/Ressources/`
✅ **Persistance** : Les images restent accessibles même après mise à jour de l'app
✅ **Portabilité** : Fonctionne sur Windows, macOS et Linux

## 🚀 Build et compilation

Lors du build avec `electron-builder`, les images sont incluses via `extraResources` :

```json
"extraResources": [
  {
    "from": "images",
    "to": "images",
    "filter": ["**/*"]
  }
]
```

Emplacement en production :
- **macOS** : `DedicaCaisse.app/Contents/Resources/images/`
- **Windows** : `resources/images/`
- **Linux** : `resources/images/`

## 🔍 Debug

Logs dans la console :
- `✅ Image copiée: Logo.png` - Copie réussie
- `✅ Image dynamique chargée: Logo.png` - Chargement réussi
- `⚠️ Image source non trouvée` - Fichier manquant
- `❌ Image non trouvée` - Erreur de chargement

## 📝 Ajouter une nouvelle image

1. Placer l'image dans `images/`
2. Ajouter le nom dans `copyResourcesToUserData()` (`main.js`) :
   ```javascript
   const imagesToCopy = [
     "Logo.png",
     "nouvelle-image.png"  // Ajouter ici
   ];
   ```
3. Utiliser dans le HTML :
   ```html
   <img data-dynamic-image="nouvelle-image.png" alt="Description">
   ```
