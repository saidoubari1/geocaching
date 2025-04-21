// serveur/routes/users.js
const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const connectDB = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const MiddleWareAuth = require('../middleware/MiddleWareAuth');

// Configuration du stockage pour les avatars
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/avatars';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite à 5MB
  fileFilter: function(req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Seules les images sont autorisées"));
  }
});

// Récupérer le classement des utilisateurs
router.get('/ranking', MiddleWareAuth, async (req, res) => {
  try {
    const db = await connectDB();
    const users = await db.collection('users').find().toArray();
    
    // Calculer le nombre de caches trouvées pour chaque utilisateur
    const ranking = users.map(user => ({
      id: user._id.toString(),
      email: user.email,
      cachesTrouvees: user.cachesTrouvees ? user.cachesTrouvees.length : 0,
      avatar: user.avatar ? true : false
    })).sort((a, b) => b.cachesTrouvees - a.cachesTrouvees);
    
    res.json(ranking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mettre à jour l'avatar de l'utilisateur
router.post('/avatar', MiddleWareAuth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucune image fournie' });
    }
    
    const db = await connectDB();
    const userId = new ObjectId(req.user.id);
    
    // Mettre à jour l'avatar dans la base de données
    await db.collection('users').updateOne(
      { _id: userId },
      { 
        $set: {
          avatar: req.file.path
        }
      }
    );
    
    // Renvoyer l'URL de l'avatar
    const avatarUrl = req.file.path;
    
    res.json({ 
      message: 'Avatar mis à jour avec succès',
      avatarUrl
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ message: error.message });
  }
});

// Récupérer l'avatar d'un utilisateur
router.get('/avatar/:userId', async (req, res) => {
  try {
    const db = await connectDB();
    const userId = new ObjectId(req.params.userId);
    const user = await db.collection('users').findOne({ _id: userId });
    
    if (!user || !user.avatar) {
      return res.status(404).json({ message: 'Avatar non trouvé' });
    }
    
    res.sendFile(path.resolve(user.avatar));
  } catch (error) {
    console.error('Error fetching avatar:', error);
    res.status(500).json({ message: error.message });
  }
});

// Obtenir les informations de l'utilisateur connecté
router.get('/me', MiddleWareAuth, async (req, res) => {
  try {
    const db = await connectDB();
    const userId = new ObjectId(req.user.id);
    
    // Récupérer l'utilisateur sans le mot de passe
    const user = await db.collection('users').findOne(
      { _id: userId },
      { projection: { password: 0 } }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.json({
      id: user._id,
      email: user.email,
      cachesTrouvees: user.cachesTrouvees || [],
      avatar: user.avatar ? true : false
    });
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;