const mongoose = require("mongoose");
const dbConfig = require("../app/config/db-config");
const temperatureService = require("../app/service/temperature-service");

export default function handler(req, res) {
    mongoose.connect(dbConfig.uri, {useNewUrlParser: true, useUnifiedTopology: true})
        .then(() => console.log('Successfully connected to MongoDB at ...'))
        .then(() => temperatureService.syncForToday())
        .then(res => res.status(200).json('Sync is finished'))
        .catch(e => console.error('Failed connected to MongoDB...', e));
}
