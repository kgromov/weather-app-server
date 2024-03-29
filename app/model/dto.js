exports.WeatherMeasurementDto = class {

    constructor(hour, temperature) {
        this.hour = hour;
        this.temperature = temperature;
    }
}

exports.TemperatureMeasurementsDto = class {

    constructor(date, dailyMeasurements) {
        this.date = date;
        if (dailyMeasurements?.length > 0) {
            this.nightTemperature = this.constructor.calculatePartOfTheDayTemperature(0, 6, dailyMeasurements);
            this.morningTemperature = this.constructor.calculatePartOfTheDayTemperature(6, 12, dailyMeasurements);
            this.afternoonTemperature = this.constructor.calculatePartOfTheDayTemperature(12, 18, dailyMeasurements);
            this.eveningTemperature = this.constructor.calculatePartOfTheDayTemperature(18, 24, dailyMeasurements);
        }
    }

    static calculatePartOfTheDayTemperature(from, to, dailyMeasurements) {
        const targetMeasurements = dailyMeasurements.filter(m => m.hour >= from && m.hour < to);
        const average = targetMeasurements.map(m => m.temperature).reduce((a, b) => a + b, 0) / targetMeasurements.length;
        console.trace('Average for: ', targetMeasurements, ' [', from, '; ', to, ']: ', average);
        return average;
    }
}


const StatusCode = {
    SUCCESS: 200,
    FAILURE: 400
}

exports.SyncStatus = class {
    constructor(code, message) {
        this.code = code;
        this.message = message;
    }
}

exports.StatusCode = StatusCode;
