const temperatureService = require("./service/temperature-service");

export default function handler(req, res) {
    temperatureService.syncForToday()
        .then(res => res.status(200).json('Sync is finished'));
}
