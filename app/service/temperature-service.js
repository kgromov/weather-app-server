const HTMLParser = require('node-html-parser');
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
    console.log('Sync date in range [', latestDate, '; ', currentDate, ']');
    const daysDiff = DateUtils.getDatesDiffInDays(latestDate, currentDate);
    console.log('Calculated days diff = ', daysDiff);
    if (daysDiff === 0) {
        return;
    }
    const syncDates = daysDiff > 1
        ? [...Array(daysDiff).keys()].map(i => i + 1)
            .map(day => DateUtils.addDays(latestDate, day))
            .map(date => date.toISOString().slice(0, 10))
        : [currentDate.toISOString().slice(0, 10)];
    console.log('syncDates = ', syncDates, '; length = ', syncDates.length);
  /*  await syncDates.forEach(async syncDate => {
        const temperatureMeasurements = await syncSinceDate(syncDate);
        console.log('temperatureMeasurementsDto = ', temperatureMeasurements);
        const record = await new DailyTemperature({...temperatureMeasurements}).save();
        console.log('Saved new daily temperature = ', record);
    });*/
    Promise.all(syncDates.map(syncDate => syncSinceDate(syncDate)))
        .then(temps =>  {
            const dailyTemperatures = temps.filter(dailyTemp =>
                !!dailyTemp.morningTemperature && !!dailyTemp.afternoonTemperature
                && !!dailyTemp.eveningTemperature && !!dailyTemp.nightTemperature
            ).map(dailyTemp => new DailyTemperature({...dailyTemp}));
            console.info(`DailyTemperatures model data to insert = ${JSON.stringify(dailyTemperatures)}`);
            DailyTemperature.insertMany(dailyTemperatures);
        })
        // .then(dailyTemperatures => DailyTemperature.insertMany(dailyTemperatures))
        .catch(err => console.error('Unable to save records  due to: ', err));
    console.log(`Sync since ${currentDate} for ${daysDiff} is finished`);
}

async function syncSinceDate(date) {
    const url = 'https://sinoptik.ua/погода-одесса/' + date;
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
            // console.trace(i, ': [text] time element: ', timeCells[i].text, ', temperature element = ', temperatureCells[i].text);
            let time = timeCells[i].text;
            time = Number.parseInt(time.slice(0, time.indexOf(':')).trim());
            let temperature = Number.parseInt(temperatureCells[i].text.trim());
            return new WeatherMeasurementDto(time, temperature);
        });
    console.trace('Daily measurements = ', measurements);
    return new TemperatureMeasurementsDto(new Date(date), measurements);
}
