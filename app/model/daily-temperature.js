const mongoose = require("mongoose");
const {connectToDatabase} = require("../config/db-config");

const temperatureSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        unique: true
    },
    morningTemperature: Number,
    afternoonTemperature: Number,
    eveningTemperature: Number,
    nightTemperature: Number
}, { collection : 'weather_archive' });

const DailyTemperature = mongoose.models.DailyTemperature
    || mongoose.model('DailyTemperature', temperatureSchema);

async function getDailyTemperatureModel() {
    await connectToDatabase();
    return DailyTemperature;
}

exports.temperatureSchema = temperatureSchema;
exports.getDailyTemperatureModel = getDailyTemperatureModel;
