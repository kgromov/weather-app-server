const dbName = process.env.DB_NAME || 'test';
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const profile = process.env.NODE_ENV;
const localUrl = `mongodb://localhost:27017/${dbName}`;
const clusterUrl = `mongodb+srv://${dbUser}:${dbPassword}@cluster0.kxhtq.mongodb.net/${dbName}`;


module.exports = {
    uri: profile === 'PROD' ? clusterUrl: localUrl
}
