const dbName = process.env.DB_NAME || 'test';
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const profile = process.env.NODE_ENV;
const localUrl = `mongodb://127.0.0.1:27017/${dbName}`;
const clusterUrl = `mongodb+srv://${dbUser}:${dbPassword}@cluster0.kxhtq.mongodb.net/${dbName}`;
const mongoose = require('mongoose');

let conn = null;

async function connectToDatabase() {
    if (conn == null) {
        const uri = profile === 'PROD' ? clusterUrl: localUrl;
        mongoose.set('strictQuery', true);
        conn = mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000, // fail fast instead of hanging
            bufferCommands: false,          // don't silently queue — surface the real error
        }).then(() => mongoose);
    }
    await conn;
    return mongoose;
}

module.exports = { connectToDatabase };