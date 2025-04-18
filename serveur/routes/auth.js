const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connectDB = require('../config/db');

// Inscription
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const db = await connectDB();
    const userExist = await db.collection('users').findOne({ email });
    if (userExist) return res.status(400).json({ message: 'Utilisateur déjà existant' });

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.collection('users').insertOne({ email, password: hashedPassword});

    res.status(201).json({ message: 'Utilisateur créé avec succès' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Connexion
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const db = await connectDB();
    const user = await db.collection('users').findOne({ email });
    if (!user) return res.status(400).json({ message: 'Identifiants invalides' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Identifiants invalides' });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
