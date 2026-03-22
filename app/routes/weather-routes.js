const express = require("express");
const weatherService = require('./../service/weather-service');
const router = express.Router();

router.get("/api/years", async (req, res) => {
    const yearsToShow = await weatherService.getYearsToShow();
    res.status(200).json(yearsToShow);
});

router.get("/api/seasons", async (req, res) => {
    const seasonsWeather = await weatherService.getYearsBySeasonsTemperature()
    res.status(200).json(seasonsWeather);
});

app.get("/api/weather/month", async (req, res) => {
    const yearMonthSummary = await weatherService.getYearsByMonthsTemperature()
    res.status(200).json(yearMonthSummary);
});

router.get("/api/weather/month/:year/:month", async (req, res) => {
    const monthWeather = await weatherService.getMonthWeather(req.params.year, req.query.month);
    res.status(200).json(monthWeather);
});

router.get("/api/summary", async (req, res) => {
    const yearsWeather = await weatherService.getYearsSummary()
    res.status(200).json(yearsWeather);
});

router.get("/api/current", async (req, res) => {
    const weatherForToday = await weatherService.getWeatherForToday();
    res.status(200).json(weatherForToday);
});

router.get("/api/single/:day", async (req, res) => {
    console.log(`Getting weather for day ${req.params.day}`);
    const weatherForToday = await weatherService.getWeatherAtDay(req.params.day)
    res.status(200).json(weatherForToday);
});

router.get("/api/:day", async (req, res) => {
    const weatherForToday = await weatherService.getWeatherDayInRange(req.params.day, req.query.years)
    res.status(200).json(weatherForToday);
});

module.exports = router;
