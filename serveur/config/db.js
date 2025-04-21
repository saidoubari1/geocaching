// serveur/config/db.js
const { MongoClient } = require('mongodb');

let db = null;

const connectDB = async () => {
  if (db) return db;
  
  try {
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    console.log('MongoDB connected');
    
    db = client.db('geocaching');
    return db;
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  }
};

module.exports = connectDB;