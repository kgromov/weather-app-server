const express = require("express");
const logger = require("./app/startup/logging");
const app = express();
const cron = require("node-cron");

require("./app/startup/web-config")(app);
require("./app/startup/db-config")();

const port = process.env.PORT | 9000;
app.listen(port, () =>  logger.info(`Server is started on port ${port}`));

cron.schedule("0 0 * * *", async () => {
    logger.info(`${new Date().toISOString()}: schedule weather sync`);
    await temperatureService.syncForToday();
    res.status(200).json('Sync is finished');
})
