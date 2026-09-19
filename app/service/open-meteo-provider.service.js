const dto = require('../model/dto');
const TemperatureMeasurementsDto = dto.TemperatureMeasurementsDto;
const webConfig = require("../config/web-config");


exports.getTemperature = async function (from, to) {
    if (from >= to) {
        return Promise.resolve([]);
    }
    console.log(`Fetch data by url = ` +`${webConfig.weatherApiURL}&start_date=${from}&end_date=${to}`);
    return fetch(`${webConfig.weatherApiURL}&start_date=${from}&end_date=${to}`)
        .then(res => res.json())
        .then(data => toTemperatureMeasurements(data));
}

// Open-Meteo response -> { 'YYYY-MM-DD': TemperatureMeasurementsDto }
function toTemperatureMeasurements(response) {
    console.log(`Extracted temperature measurements: ${JSON.stringify(response)}`);
    const result = {};
    for (const [date, measurements] of groupByDay(response)) {
        result[date] = new TemperatureMeasurementsDto(measurements);
    }
    return result;
}

// Open-Meteo response -> { 'YYYY-MM-DD': [{hour, temperature}, ...] }
function groupByDay({hourly}) {
    const byDate = new Map();
    hourly.time.forEach((t, i) => {
        const [date, time] = t.split('T');              // "2026-09-03T06:00"
        const hour = parseInt(time.slice(0, 2), 10);    // avoids Date/timezone parsing
        if (!byDate.has(date)) byDate.set(date, []);
        byDate.get(date).push({hour, temperature: hourly.temperature_2m[i]});
    });
    return byDate;
}
