const mongoose = require("mongoose");
const dbConfig = require("../config/db-config");
const temperatureService = require("../service/temperature-service");

export async function handler(req, res) {
    return mongoose.connect(dbConfig.uri)
        .then(() => console.log('[CRON] Successfully connected to MongoDB at ...'))
        .then(() => temperatureService.syncForToday())
        .then(async res => res.status(200).json('Sync is finished'))
        .catch(e => console.error('Failed connected to MongoDB...', e));
}
