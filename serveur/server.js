// serveur/server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging pour déboguer
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  if (req.method !== 'GET') {
    console.log('Body:', req.body);
  }
  next();
});

// Créer les dossiers d'upload s'ils n'existent pas
const uploadsDir = path.join(__dirname, 'uploads');
const geocachesDir = path.join(uploadsDir, 'geocaches');
const avatarsDir = path.join(uploadsDir, 'avatars');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
if (!fs.existsSync(geocachesDir)) {
  fs.mkdirSync(geocachesDir);
}
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir);
}

// Servir les fichiers statiques du dossier 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connexion MongoDB
connectDB().then(() => {
    // Routes
    app.use('/auth', require('./routes/auth'));
    app.use('/api/geocache', require('./routes/geocache'));
    app.use('/api/users', require('./routes/users'));

    // Route pour tester l'API
    app.get('/api', (req, res) => {
      res.json({ message: "API Geocaching disponible" });
    });

    // Route par défaut
    app.get('/', (req, res) => {
      res.send('API de Geocaching fonctionne');
    });

    // Middleware de gestion des erreurs
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({ message: "Erreur serveur" });
    });

    const PORT = process.env.PORT || 5000;
    // Écouter sur toutes les interfaces réseau avec '0.0.0.0'
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Serveur lancé sur le port ${PORT}`);
      console.log(`Adresse du serveur: http://localhost:${PORT}`);
    });
}).catch(err => {
    console.log("Impossible de se connecter à MongoDB", err);
});
