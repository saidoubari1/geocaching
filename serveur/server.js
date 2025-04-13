const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Connexion MongoDB
require('./config/db')();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/geocache', require('./routes/geocache'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Serveur lancé sur le port ${PORT}`));
