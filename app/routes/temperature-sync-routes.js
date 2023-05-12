const express = require("express");
const temperatureService = require('./../service/temperature-service');
const router = express.Router();

router.get("/", async (req, res) => {
    await temperatureService.syncForToday();
    res.status(200).json('Sync is finished');
})

module.exports = router;
