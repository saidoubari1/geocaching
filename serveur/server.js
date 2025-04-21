const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Connexion MongoDB
connectDB().then(() => {
    //Routes
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/geocache', require('./routes/geocache'));

    const PORT = process.env.PORT || 5000;
    // Écouter sur toutes les interfaces réseau avec '0.0.0.0'
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Serveur lancé sur le port ${PORT}`);
        console.log(`Adresse du serveur: http://localhost:${PORT}`);
    });
}).catch(err => {
    console.log("Impossible de se connecter à MongoDB", err);
});