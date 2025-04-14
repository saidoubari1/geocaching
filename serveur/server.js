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
    app.listen(PORT, () => console.log('Serveur lancé sur le port ${PORT}'));
}).catch(err => {
    console.log("Impossible de sec onnecter à MongoDB", err);
});