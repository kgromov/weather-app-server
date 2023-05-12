const logger = require('./../startup/logging');
const HTMLParser = require('node-html-parser');
const config = require("config")
const http = require('./http-service');
const DailyTemperature = require("../model/daily-temperature").DailyTemperature;
const DateUtils = require("./date-utils");
const dto = require('../model/dto');
const WeatherMeasurementDto = dto.WeatherMeasurementDto;
const TemperatureMeasurementsDto = dto.TemperatureMeasurementsDto;

exports.syncForToday = async function () {
    const latestDayTemperature = await DailyTemperature.find()
        .sort({"date": -1})
        // .select('date')
        .limit(1);
    const currentDate = new Date();
    const latestDate = new Date(latestDayTemperature["0"].date);
    logger.info(`Sync date in range [${latestDate}; ${currentDate}]`);
    const daysDiff = DateUtils.getDatesDiffInDays(latestDate, currentDate);
    logger.debug(`Calculated days diff = ${daysDiff}`);
    if (daysDiff === 0) {
        return;
    }
    const syncDates = daysDiff > 1
        ? [...Array(daysDiff).keys()].map(i => i + 1)
            .map(day => DateUtils.addDays(latestDate, day))
            .map(date => date.toISOString().slice(0, 10))
        : [currentDate.toISOString().slice(0, 10)];

    syncDates.forEach(async syncDate => {
        const temperatureMeasurements = await syncSinceDate(syncDate);
        logger.silly(`temperatureMeasurementsDto = ${temperatureMeasurements}`);
        let record = await new DailyTemperature({...temperatureMeasurements}).save();
        logger.info(`Saved new daily temperature = ${record}`);
    });
}

async function syncSinceDate(date) {
    const url = config.get("sync.sourceUri") + '/' + config.get("sync.cityPath") + '/' + date;
    const encodedUrl = encodeURI(url);
    const response = await http.get(encodedUrl);
    return extractDailyTemperature(date, response);
}

function extractDailyTemperature(date, weatherContent) {
    const root = HTMLParser.parse(weatherContent);
    const weatherTable = root.querySelector('table.weatherDetails');
    const timeCells = weatherTable.querySelectorAll('tbody>tr.gray.time>td');
    const temperatureCells = weatherTable.querySelectorAll('tbody>tr.temperature>td');

    const measurements = [...Array(timeCells.length).keys()]
        .map(i => {
            logger.silly(i, ': [text] time element: ', timeCells[i].text, ', temperature element = ', temperatureCells[i].text);
            let time = timeCells[i].text;
            time = Number.parseInt(time.slice(0, time.indexOf(':')).trim());
            let temperature = Number.parseInt(temperatureCells[i].text.trim());
            return new WeatherMeasurementDto(time, temperature);
        });
    logger.debug(`Daily measurements = ${measurements}`);
    return new TemperatureMeasurementsDto(new Date(date), measurements);
}
