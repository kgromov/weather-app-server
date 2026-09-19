const sinopticService = require("./sinoptic-provider.service");
const openMeteoService = require("./open-meteo-provider.service");
const DailyTemperature = require("../model/daily-temperature").DailyTemperature;
const DateUtils = require("./date-utils");
const {SyncStatus, StatusCode} = require("../model/dto");

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
    const from = DateUtils.addDays(latestDate, 1);
    const daysDiff = DateUtils.getDatesDiffInDays(from, endDate);
    console.log('Calculated days diff = ', daysDiff);
    if (daysDiff <= 0) {
        console.log(`Up to date ${from}`);
        return new SyncStatus(StatusCode.SUCCESS, `Sync succeed: Up to date ${DateUtils.formatToISODate(from)}`);
    }
    // const request = sinopticService.getTemperature(from, endDate);
    return openMeteoService.getTemperature(DateUtils.formatToISODate(from), DateUtils.formatToISODate(endDate))
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
            console.log(`Sync since since ${from} to ${endDate} is finished`);
            return new SyncStatus(StatusCode.SUCCESS, `Sync succeed: since ${from} to ${endDate}`);
        }).catch(err => {
            console.error('Unable to save records  due to: ', err);
            return new SyncStatus(StatusCode.FAILURE, `Sync failed: Unable to save records  due to:  ${err}`);
        });
}


