const sinopticService = require("./sinoptic-provider.service");
const openMeteoService = require("./open-meteo-provider.service");
const DailyTemperature = require("../model/daily-temperature").DailyTemperature;
const DateUtils = require("./date-utils");
const {SyncStatus, StatusCode} = require("../model/dto");
const {addDays, differenceInDays, isSameDay} = require("date-fns");

exports.isUpToDate = async function () {
    const latestDayTemperature = await DailyTemperature.find()
        .sort({"date": -1})
        // .select('date')
        .limit(1);
    const latestDate = new Date(latestDayTemperature["0"].date);
    const nextEndDate = getNextEndDate();
    return isSameDay(latestDate, nextEndDate);
}

exports.syncForToday = async function () {
    const latestDayTemperature = await DailyTemperature.find()
        .sort({"date": -1})
        // .select('date')
        .limit(1);
    const endDate = getNextEndDate();
    const latestDate = new Date(latestDayTemperature["0"].date);
    const from = DateUtils.addDays(latestDate, 1);
    console.log('Sync date in range [', DateUtils.formatToLocalizedDate(from), '; ', DateUtils.formatToLocalizedDate(endDate), ']');
    if (isSameDay(latestDate, endDate)) {
        console.log(`Up to date ${from}`);
        return new SyncStatus(StatusCode.SUCCESS, `Sync succeed: Up to date ${DateUtils.formatToLocalizedDate(latestDate)}`);
    }
    // return sinopticService.getTemperature(from, endDate)
        return openMeteoService.getTemperature(DateUtils.formatToLocalizedDate(from), DateUtils.formatToLocalizedDate(endDate))
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

function getNextEndDate() {
    const currentDateInKyiv = DateUtils.dateInUATimeZone(new Date());
    return currentDateInKyiv.getHours() < 20 ? DateUtils.addDays(currentDateInKyiv, -1) : currentDateInKyiv;
}


