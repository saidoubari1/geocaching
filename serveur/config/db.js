const {MongoClient} = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();


const MONGO_URL = 'mongodb://127.0.0.1:27017';
DB_NAME = 'geocaching';

let db;

const connectDB = async () => {
    if(db) return db; // pour éviter de se connecter à chaque fois
    try {
        const client = new MongoClient(MONGO_URL);
        await client.connect();
        db = client.db(DB_NAME);
        console.log("MongoDB connected using native driver");
        return db;
    } catch (err) {
        console.error(err);
        throw err;
    }
};

module.exports = connectDB;

