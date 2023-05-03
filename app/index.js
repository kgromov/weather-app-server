const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const dbConfig = require("./config/db-config");
const weatherService = require('./service/weather-service');

const app = express();
const originUri = process.env.CORS_ORIGIN || 'http://localhost:4200';
const corsOptions = {
    origin: `${originUri}`
};

app.use(express.json())
app.use(cors(corsOptions));

// establish connection
mongoose.connect(dbConfig.uri, {useNewUrlParser: true, useUnifiedTopology: true})
    .then(() => console.log('Successfully connected to MongoDB at ...'))
    .catch(e => console.error('Failed connected to MongoDB...', e));

app.get("/weather/years", async (req, res) => {
    const yearsToShow = await weatherService.getYearsToShow();
    res.status(200).json(yearsToShow);
});

app.get("/weather/seasonsInYear", async (req, res) => {
    const seasonsWeather = await weatherService.getYearsBySeasonsTemperature()
    res.status(200).json(seasonsWeather);
});

app.get("/weather/summary", async (req, res) => {
    const yearsWeather = await weatherService.getYearsSummary()
    res.status(200).json(yearsWeather);
});

app.get("/weather/current", async (req, res) => {
    const weatherForToday = await weatherService.getWeatherForToday();
    res.status(200).json(weatherForToday);
});

app.get("/weather/single/:day", async (req, res) => {
    console.log(`Getting weather for day ${req.params.day}`);
    const weatherForToday = await weatherService.getWeatherAtDay(req.params.day)
    res.status(200).json(weatherForToday);
});

app.get("/weather/:day", async (req, res) => {
    const weatherForToday = await weatherService.getWeatherDayInRange(req.params.day, req.query.years)
    res.status(200).json(weatherForToday);
});

const port = process.env.PORT | 9000;
app.listen(port, () => {
    console.log(`Server is started on post ${port}`);
});

module.exports = app
