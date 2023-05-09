const mongoose = require("mongoose");

const temperatureSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
    },
    morningTemperature: Number,
    afternoonTemperature: Number,
    eveningTemperature: Number,
    nightTemperature: Number
}, { collection : 'weather_archive' });

exports.temperatureSchema = temperatureSchema;
exports.DailyTemperature = mongoose.model('DailyTemperature', temperatureSchema);
