const dbName = process.env.DB_NAME || 'test';
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const profile = process.env.NODE_ENV;
const localUrl = `mongodb://127.0.0.1:27017/${dbName}`;
const dockerUrl = `mongodb://root:root@weather-db:27017/${dbName}?authSource=admin`;
const clusterUrl = `mongodb+srv://${dbUser}:${dbPassword}@cluster0.kxhtq.mongodb.net/${dbName}`;

module.exports = {
    uri: profile === 'PROD' ? clusterUrl : (profile === 'DOCKER' ? dockerUrl : localUrl)
}
