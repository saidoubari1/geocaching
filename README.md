# Projet Geocaching

Application mobile avec architecture client-serveur (frontend-backend), utilisant React Native/Expo pour le frontend et Node.js pour le backend.

## Structure du projet

```
├── client/                 # Application mobile React Native/Expo
│   ├── assets/             # Images, polices et autres ressources statiques
│   ├── src/                # Code source principal du client
│   │   ├── context/        # Contextes React (état global, thèmes, etc.)
│   │   ├── navigation/     # Configuration de la navigation
│   │   ├── screens/        # Écrans de l'application
│   │   └── services/       # Services (API, stockage, etc.)
│   ├── App.js              # Point d'entrée de l'application
│   ├── app.json            # Configuration Expo
│   ├── index.ts            # Point d'entrée pour l'initialisation
│   ├── package.json        # Dépendances et scripts du client
│   └── tsconfig.json       # Configuration TypeScript
│
├── serveur/                # Serveur backend Node.js
│   ├── config/             # Configuration du serveur
│   ├── middleware/         # Middleware Express
│   ├── routes/             # Endpoints API
│   ├── package.json        # Dépendances et scripts du serveur
│   └── server.js           # Point d'entrée du serveur
│
├── .gitignore              # Fichiers à ignorer par Git
└── README.md               # Ce fichier
```

## Prérequis

- Node.js (v18 ou supérieur)
- npm ou yarn
- Expo CLI (`npm install -g expo-cli`)

## Installation

### Client (Application mobile)

```bash
cd client
npm install
# ou
yarn install
```

### Serveur

```bash
cd serveur
npm install
# ou
yarn install
```

## Démarrage du projet

### Client

```bash
cd client
npm start
# ou
yarn start
```

Cela lancera l'application avec Expo. Vous pourrez alors:
- Ouvrir l'application sur un émulateur iOS/Android
- Scanner le QR code avec l'application Expo Go sur votre appareil physique
- Lancer l'application dans un navigateur web

### Serveur

```bash
cd serveur
npm start
# ou
yarn start
```

## Fonctionnalités principales

- **Authentification** : Inscription, connexion et gestion des profils utilisateurs
- **Navigation intuitive** : Interface utilisateur fluide avec navigation par onglets et pile
- **Partage de localisation** : Utilisation d'Expo Location pour partager et consulter les positions
- **Gestion des médias** : Upload et visualisation d'images via Expo Image Picker
- **Mode hors ligne** : Stockage local des données pour utilisation sans connexion
- **Synchronisation multi-appareils** : Profil et données accessibles sur différents appareils
- **Thème personnalisable** : Options de personnalisation de l'interface utilisateur
- **Sécurité des données** : Encryption des informations sensibles et authentification sécurisée

## Technologies utilisées

### Client
- React Native / Expo
- TypeScript
- React Navigation
- Axios
- AsyncStorage
- Expo Location & Image Picker

### Serveur
- Node.js
- Express
- MongoDB
