// serveur/routes/geocache.js
const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const connectDB = require('../config/db');
const MiddleWareAuth = require('../middleware/MiddleWareAuth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration du stockage pour les photos de geocache
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/geocaches';
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

// ---------------------------------------------------------
// CREATE a new geocache
// Endpoint: POST /api/geocache
// Required fields in request body: 
//   - coordinates: array [lat, lng] or object {lat, lng}
//   - difficulty: number from 1 to 5
// Optional field: description, photo
// ---------------------------------------------------------
router.post('/', MiddleWareAuth, upload.single('photo'), async (req, res) => {
  try {
    const { coordinates, difficulty, description } = req.body;
    
    // Vérifier les champs requis
    if (!coordinates && (!req.body['coordinates[0]'] || !req.body['coordinates[1]'])) {
      return res.status(400).json({ message: 'Coordonnées requises' });
    }
    
    if (!difficulty) {
      return res.status(400).json({ message: 'Difficulté requise' });
    }
    
    const db = await connectDB();
    
    // Préparer les coordonnées au bon format
    let coords;
    if (coordinates) {
      if (typeof coordinates === 'string') {
        coords = JSON.parse(coordinates);
      } else {
        coords = coordinates;
      }
    } else {
      coords = [
        parseFloat(req.body['coordinates[0]']),
        parseFloat(req.body['coordinates[1]'])
      ];
    }
    
    // Créer l'objet geocache
    const geocache = {
      coordinates: coords,
      difficulty: parseInt(difficulty),
      description: description || '',
      creator: req.user.id,
      createdAt: new Date(),
      findings: [],
      comments: []
    };
    
    // Ajouter la photo si elle existe
    if (req.file) {
      geocache.photo = {
        path: req.file.path,
        contentType: req.file.mimetype
      };
    }
    
    // Insérer la geocache dans la base de données
    const result = await db.collection('geocaches').insertOne(geocache);
    
    res.status(201).json({
      message: 'Geocache créée avec succès',
      geocacheId: result.insertedId
    });
  } catch (error) {
    console.error('Error creating geocache:', error);
    res.status(500).json({ message: error.message });
  }
});

// ---------------------------------------------------------
// UPDATE an existing geocache
// Endpoint: PUT /api/geocache/:id
// Only the creator of the geocache can update it.
// ---------------------------------------------------------
router.put('/:id', MiddleWareAuth, upload.single('photo'), async (req, res) => {
  try {
    const geocacheId = new ObjectId(req.params.id);
    const { coordinates, difficulty, description } = req.body;
    
    const db = await connectDB();
    
    // Vérifier si la geocache existe et si l'utilisateur est le créateur
    const geocache = await db.collection('geocaches').findOne({ _id: geocacheId });
    
    if (!geocache) {
      return res.status(404).json({ message: 'Geocache non trouvée' });
    }
    
    if (geocache.creator !== req.user.id) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à modifier cette geocache' });
    }
    
    // Préparer les mises à jour
    const updates = {};
    
    if (coordinates) {
      if (typeof coordinates === 'string') {
        updates.coordinates = JSON.parse(coordinates);
      } else {
        updates.coordinates = coordinates;
      }
    }
    
    if (difficulty) {
      updates.difficulty = parseInt(difficulty);
    }
    
    if (description !== undefined) {
      updates.description = description;
    }
    
    // Ajouter la photo si elle a été mise à jour
    if (req.file) {
      updates.photo = {
        path: req.file.path,
        contentType: req.file.mimetype
      };
    }
    
    // Mettre à jour la geocache
    await db.collection('geocaches').updateOne(
      { _id: geocacheId },
      { $set: updates }
    );
    
    res.json({ message: 'Geocache mise à jour avec succès' });
  } catch (error) {
    console.error('Error updating geocache:', error);
    res.status(500).json({ message: error.message });
  }
});

// ---------------------------------------------------------
// DELETE a geocache
// Endpoint: DELETE /api/geocache/:id
// Only the creator of the geocache can delete it.
// ---------------------------------------------------------
router.delete('/:id', MiddleWareAuth, async (req, res) => {
  try {
    const geocacheId = new ObjectId(req.params.id);
    
    const db = await connectDB();
    
    // Vérifier si la geocache existe et si l'utilisateur est le créateur
    const geocache = await db.collection('geocaches').findOne({ _id: geocacheId });
    
    if (!geocache) {
      return res.status(404).json({ message: 'Geocache non trouvée' });
    }
    
    if (geocache.creator !== req.user.id) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à supprimer cette geocache' });
    }
    
    // Supprimer la photo si elle existe
    if (geocache.photo && geocache.photo.path) {
      try {
        fs.unlinkSync(geocache.photo.path);
      } catch (err) {
        console.error('Error deleting photo file:', err);
      }
    }
    
    // Supprimer la geocache
    await db.collection('geocaches').deleteOne({ _id: geocacheId });
    
    res.json({ message: 'Geocache supprimée avec succès' });
  } catch (error) {
    console.error('Error deleting geocache:', error);
    res.status(500).json({ message: error.message });
  }
});

// ---------------------------------------------------------
// RETRIEVE geocaches
// Endpoint: GET /api/geocache
// This endpoint retrieves the list of all geocaches.
// ---------------------------------------------------------
router.get('/', MiddleWareAuth, async (req, res) => {
  try {
    const db = await connectDB();
    const geocaches = await db.collection('geocaches').find().toArray();
    
    // Enrichir les données avec le nom de l'utilisateur créateur
    const enrichedGeocaches = await Promise.all(geocaches.map(async (geocache) => {
      try {
        // Trouver l'email du créateur
        const creator = await db.collection('users').findOne(
          { _id: new ObjectId(geocache.creator) },
          { projection: { email: 1 } }
        );
        
        return {
          ...geocache,
          creatorEmail: creator ? creator.email : 'Utilisateur inconnu'
        };
      } catch (error) {
        console.error('Error enriching geocache:', error);
        return geocache;
      }
    }));
    
    res.json(enrichedGeocaches);
  } catch (error) {
    console.error('Error fetching geocaches:', error);
    res.status(500).json({ message: error.message });
  }
});

// ---------------------------------------------------------
// RETRIEVE geocaches nearby
// Endpoint: GET /api/geocache/nearby
// This endpoint retrieves geocaches near specified coordinates.
// ---------------------------------------------------------
router.get('/nearby', MiddleWareAuth, async (req, res) => {
  try {
    const { latitude, longitude, radius = 5 } = req.query; // rayon en km
    
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude et longitude requises' });
    }
    
    const db = await connectDB();
    const geocaches = await db.collection('geocaches').find().toArray();
    
    // Filtrer les geocaches à proximité
    const nearbyGeocaches = geocaches.filter(geocache => {
      const lat1 = parseFloat(latitude);
      const lon1 = parseFloat(longitude);
      
      let lat2, lon2;
      
      if (Array.isArray(geocache.coordinates)) {
        [lat2, lon2] = geocache.coordinates;
      } else {
        lat2 = geocache.coordinates.latitude || geocache.coordinates.lat;
        lon2 = geocache.coordinates.longitude || geocache.coordinates.lng;
      }
      
      const distance = calculateDistance(lat1, lon1, lat2, lon2);
      return distance <= parseFloat(radius);
    });
    
    // Enrichir les données avec le nom de l'utilisateur créateur
    const enrichedGeocaches = await Promise.all(nearbyGeocaches.map(async (geocache) => {
      try {
        // Trouver l'email du créateur
        const creator = await db.collection('users').findOne(
          { _id: new ObjectId(geocache.creator) },
          { projection: { email: 1 } }
        );
        
        return {
          ...geocache,
          creatorEmail: creator ? creator.email : 'Utilisateur inconnu'
        };
      } catch (error) {
        console.error('Error enriching geocache:', error);
        return geocache;
      }
    }));
    
    res.json(enrichedGeocaches);
  } catch (error) {
    console.error('Error fetching nearby geocaches:', error);
    res.status(500).json({ message: error.message });
  }
});

// ---------------------------------------------------------
// RETRIEVE a specific geocache
// Endpoint: GET /api/geocache/:id
// ---------------------------------------------------------
router.get('/:id', MiddleWareAuth, async (req, res) => {
  try {
    const geocacheId = new ObjectId(req.params.id);
    
    const db = await connectDB();
    const geocache = await db.collection('geocaches').findOne({ _id: geocacheId });
    
    if (!geocache) {
      return res.status(404).json({ message: 'Geocache non trouvée' });
    }
    
    // Trouver l'email du créateur
    const creator = await db.collection('users').findOne(
      { _id: new ObjectId(geocache.creator) },
      { projection: { email: 1 } }
    );
    
    // Enrichir les commentaires avec les emails des auteurs
    const enrichedComments = await Promise.all((geocache.comments || []).map(async (comment) => {
      try {
        const author = await db.collection('users').findOne(
          { _id: new ObjectId(comment.commenter) },
          { projection: { email: 1 } }
        );
        
        return {
          ...comment,
          authorEmail: author ? author.email : 'Utilisateur inconnu'
        };
      } catch (error) {
        console.error('Error enriching comment:', error);
        return comment;
      }
    }));
    
    const enrichedGeocache = {
      ...geocache,
      creatorEmail: creator ? creator.email : 'Utilisateur inconnu',
      comments: enrichedComments
    };
    
    res.json(enrichedGeocache);
  } catch (error) {
    console.error('Error fetching geocache:', error);
    res.status(500).json({ message: error.message });
  }
});

// ---------------------------------------------------------
// ADD COMMENT to a geocache
// Endpoint: POST /api/geocache/:id/comment
// ---------------------------------------------------------
router.post('/:id/comment', MiddleWareAuth, async (req, res) => {
  try {
    const geocacheId = new ObjectId(req.params.id);
    const { comment } = req.body;
    
    if (!comment) {
      return res.status(400).json({ message: 'Commentaire requis' });
    }
    
    const db = await connectDB();
    const geocache = await db.collection('geocaches').findOne({ _id: geocacheId });
    
    if (!geocache) {
      return res.status(404).json({ message: 'Geocache non trouvée' });
    }
    
    // Ajouter le commentaire
    const newComment = {
      commenter: req.user.id,
      text: comment,
      createdAt: new Date()
    };
    
    await db.collection('geocaches').updateOne(
      { _id: geocacheId },
      { $push: { comments: newComment } }
    );
    
    res.json({ message: 'Commentaire ajouté avec succès' });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: error.message });
  }
});

// ---------------------------------------------------------
// MARK a geocache as found
// Endpoint: POST /api/geocache/:id/found
// ---------------------------------------------------------
router.post('/:id/found', MiddleWareAuth, async (req, res) => {
  try {
    const geocacheId = new ObjectId(req.params.id);
    const { comment } = req.body;
    
    const db = await connectDB();
    const geocache = await db.collection('geocaches').findOne({ _id: geocacheId });
    
    if (!geocache) {
      return res.status(404).json({ message: 'Geocache non trouvée' });
    }
    
    // Vérifier si l'utilisateur est le créateur
    if (geocache.creator === req.user.id) {
      return res.status(400).json({ message: 'Vous ne pouvez pas marquer votre propre geocache comme trouvée' });
    }
    
    // Vérifier si l'utilisateur a déjà trouvé cette geocache
    const alreadyFound = (geocache.findings || []).some(
      finding => finding.user === req.user.id
    );
    
    if (alreadyFound) {
      return res.status(400).json({ message: 'Vous avez déjà trouvé cette geocache' });
    }
    
    // Ajouter la geocache aux trouvailles de l'utilisateur
    await db.collection('users').updateOne(
      { _id: new ObjectId(req.user.id) },
      { 
        $push: { 
          cachesTrouvees: {
            cache: geocacheId,
            foundAt: new Date(),
            comment: comment || ''
          }
        }
      }
    );
    
    // Ajouter l'utilisateur aux trouveurs de la geocache
    await db.collection('geocaches').updateOne(
      { _id: geocacheId },
      { 
        $push: { 
          findings: {
            user: req.user.id,
            found: true,
            comment: comment || '',
            date: new Date()
          }
        }
      }
    );
    
    // Si un commentaire est fourni, l'ajouter également
    if (comment && comment.trim()) {
      await db.collection('geocaches').updateOne(
        { _id: geocacheId },
        { 
          $push: { 
            comments: {
              commenter: req.user.id,
              text: comment,
              createdAt: new Date()
            }
          }
        }
      );
    }
    
    res.json({ message: 'Geocache marquée comme trouvée avec succès' });
  } catch (error) {
    console.error('Error marking geocache as found:', error);
    res.status(500).json({ message: error.message });
  }
});

// ---------------------------------------------------------
// GET photo of a geocache
// Endpoint: GET /api/geocache/:id/photo
// ---------------------------------------------------------
router.get('/:id/photo', async (req, res) => {
  try {
    const geocacheId = new ObjectId(req.params.id);
    
    const db = await connectDB();
    const geocache = await db.collection('geocaches').findOne(
      { _id: geocacheId },
      { projection: { photo: 1 } }
    );
    
    if (!geocache || !geocache.photo || !geocache.photo.path) {
      return res.status(404).json({ message: 'Photo non trouvée' });
    }
    
    res.sendFile(path.resolve(geocache.photo.path));
  } catch (error) {
    console.error('Error fetching geocache photo:', error);
    res.status(500).json({ message: error.message });
  }
});

// Fonction pour calculer la distance entre deux points (formule de Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Rayon de la Terre en km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance en km
  return distance;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

module.exports = router;