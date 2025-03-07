const HTMLParser = require('node-html-parser');
const http = require('./http-service');
const DailyTemperature = require("../model/daily-temperature").DailyTemperature;
const DateUtils = require("./date-utils");
const dto = require('../model/dto');
const WeatherMeasurementDto = dto.WeatherMeasurementDto;
const TemperatureMeasurementsDto = dto.TemperatureMeasurementsDto;
const StatusCode = dto.StatusCode;
const SyncStatus = dto.SyncStatus;

exports.isUpToDate = async function () {
    const latestDayTemperature = await DailyTemperature.find()
        .sort({"date": -1})
        // .select('date')
        .limit(1);
    const currentDate = new Date();
    const endDate = currentDate.getUTCHours() < 20 ? DateUtils.addDays(currentDate, -1) : currentDate;
    const latestDate = new Date(latestDayTemperature["0"].date);
    console.log('Sync date in range [', latestDate, '; ', endDate, ']');
    const daysDiff = DateUtils.getDatesDiffInDays(latestDate, endDate);
    console.log('Calculated days diff = ', daysDiff);
    return daysDiff <= 0;
}

exports.syncForToday = async function () {
    const latestDayTemperature = await DailyTemperature.find()
        .sort({"date": -1})
        // .select('date')
        .limit(1);
    const currentDate = new Date();
    const endDate = currentDate.getUTCHours() < 20 ? DateUtils.addDays(currentDate, -1) : currentDate;
    const latestDate = new Date(latestDayTemperature["0"].date);
    console.log('Sync date in range [', latestDate, '; ', endDate, ']');
    const daysDiff = DateUtils.getDatesDiffInDays(latestDate, endDate);
    console.log('Calculated days diff = ', daysDiff);
    if (daysDiff <= 0) {
        console.log(`Up to date ${latestDate}`);
        return new SyncStatus(StatusCode.SUCCESS, `Sync succeed: Up to date ${DateUtils.formatToISODate(latestDate)}`);
    }
    const syncDates = daysDiff > 1
        ? [...Array(daysDiff).keys()]
            .map(i => i + 1)
            .map(day => DateUtils.addDays(latestDate, day))
            .map(date => DateUtils.formatToISODate(date))
        : [DateUtils.formatToISODate(endDate)];
    console.log('syncDates = ', syncDates, '; length = ', syncDates.length);
    return Promise.all(syncDates.map(syncDate => syncSinceDatePromise(syncDate)))
        .then(temps => {
            console.log(`Extracted dailies temperature: ${JSON.stringify(temps)}`);
            return temps.filter(dailyTemp =>
                dailyTemp.morningTemperature !== undefined && dailyTemp.afternoonTemperature !== undefined
                && dailyTemp.eveningTemperature !== undefined && dailyTemp.nightTemperature !== undefined
            ).map(dailyTemp => new DailyTemperature({...dailyTemp}));
        }).then(dailyTemperatures => {
            console.info(`DailyTemperatures model data to insert = ${JSON.stringify(dailyTemperatures)}`);
            DailyTemperature.insertMany(dailyTemperatures);
        }).then(() => {
            console.log(`Sync since since ${syncDates[0]} to ${syncDates[daysDiff - 1]} is finished`);
            return new SyncStatus(StatusCode.SUCCESS, `Sync succeed: since ${syncDates[0]} to ${syncDates[daysDiff - 1]}`);
        }).catch(err => {
            console.error('Unable to save records  due to: ', err);
            return new SyncStatus(StatusCode.FAILURE, `Sync failed: Unable to save records  due to:  ${err}`);
        })
}

function syncSinceDatePromise(date) {
    const url = 'https://sinoptik.ua/ru/pohoda/odesa/' + date;
    const encodedUrl = encodeURI(url);
    return http.get(encodedUrl)
        .then(response => extractDailyTemperature(date, response));
}

function extractDailyTemperature(date, weatherContent) {
    const root = HTMLParser.parse(weatherContent);
    console.debug('tables on page = ', root.querySelector('table')?.length ?? 0);
    const weatherTable = root.querySelector('table.mK1PSQn1,table.iC5eqyQP');
    if (!weatherTable) {
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
