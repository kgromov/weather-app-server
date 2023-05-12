const mongoose = require("mongoose");
const logger = require("./logging");

const dbName = process.env.DB_NAME || 'test';
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const profile = process.env.NODE_ENV;
const localUrl = `mongodb://localhost:27017/${dbName}`;
const clusterUrl = `mongodb+srv://${dbUser}:${dbPassword}@cluster0.kxhtq.mongodb.net/${dbName}`;

// establish connection
module.exports = function () {
    const uri = profile === 'prod' ? clusterUrl: localUrl
    mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true})
        .then(() => logger.info('Successfully connected to MongoDB at ...'));
        // .catch(err => logger.error('Failed connected to MongoDB...', err));
}
