const {DailyTemperature} = require("../model/daily-temperature");
const dto = require('../model/dto');
const webConfig = require("../config/web-config");
const http = require("./http-service");
const HTMLParser = require("node-html-parser");
const DateUtils = require("./date-utils");
const WeatherMeasurementDto = dto.WeatherMeasurementDto;
const TemperatureMeasurementsDto = dto.TemperatureMeasurementsDto;


exports.getTemperature = async function(from, to) {
    const daysDiff = DateUtils.getDatesDiffInDays(from, to);
    if (daysDiff <= 0) {
        return Promise.resolve([]);
    }
    const syncDates = daysDiff > 1
        ? [...Array(daysDiff).keys()]
            .map(day => DateUtils.addDays(from, day))
            .map(date => DateUtils.formatToISODate(date))
        : [DateUtils.formatToISODate(to)];
    console.log('syncDates = ', syncDates, '; length = ', syncDates.length);
    return Promise.all(syncDates.map(syncDate => syncSinceDatePromise(syncDate)));
}

function syncSinceDatePromise(date) {
    const url = `${webConfig.weatherURL}/${date}`;
    const encodedUrl = encodeURI(url);
    return http.get(encodedUrl)
        .then(response => extractDailyTemperature(date, response));
}

function extractDailyTemperature(date, weatherContent) {
    const root = HTMLParser.parse(weatherContent);
    console.debug('tables on page = ', root.querySelectorAll('table')?.length ?? 0);
    const weatherTable = root.querySelector('table.mK1PSQn1,table.iC5eqyQP,table.iC5eqyQP');
    if (!weatherTable) {
        console.debug(`content = ${root.text}`);
        console.warn('Content not found for date = ', date);
    }
    const timeCells = weatherTable.querySelectorAll('thead>tr:nth-child(2)>td');
    const temperatureCells = weatherTable.querySelectorAll('tbody>tr:nth-child(2)>td');

    const measurements = [...Array(timeCells.length).keys()]
        .map(i => {
            // console.trace(i, ': [text] time element: ', timeCells[i].text, ', temperature element = ', temperatureCells[i].text);
            let time = timeCells[i].text;
            time = Number.parseInt(time.slice(0, time.indexOf(':')).trim());
            let temperature = Number.parseInt(temperatureCells[i].text.trim());
            return new WeatherMeasurementDto(time, temperature);
        });
    console.trace('Daily measurements [', date, '] = ', measurements);
    return new TemperatureMeasurementsDto(new Date(date), measurements);
}
