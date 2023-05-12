const logger = require("../app/startup/logging");
const mongoose = require("mongoose");
const temperatureService = require("../app/service/temperature-service");

const dbName = process.env.DB_NAME || 'test';
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const profile = process.env.NODE_ENV;
const localUrl = `mongodb://localhost:27017/${dbName}`;
const clusterUrl = `mongodb+srv://${dbUser}:${dbPassword}@cluster0.kxhtq.mongodb.net/${dbName}`;

export default function handler(req, res) {
    logger.info(`${new Date().toISOString()}: [serverless function] schedule weather sync`);
    const uri = profile === 'prod' ? clusterUrl: localUrl
    mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true})
        .then(() => logger.info('Successfully connected to MongoDB at ...'))
        .then(() => temperatureService.syncForToday())
        .then(res => res.status(200).json('Sync is finished'))
        .catch(e => logger.error('Failed connected to MongoDB...', e));
}
