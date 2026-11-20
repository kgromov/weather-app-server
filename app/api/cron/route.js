import mongoose from "mongoose";
import dbConfig from "../../config/db-config";
import temperatureService from "../../service/temperature-service";
const {logger} = require("../../config/logging");

export async function GET(request) {
    try {
        await mongoose.connect(dbConfig.uri);
        logger.info('[CRON] Successfully connected to MongoDB');
        const syncStatus = await temperatureService.syncForToday();
        return Response.json({ message: syncStatus.message }, { status: syncStatus.code });
    } catch (e) {
        logger.error('Failed to connect to MongoDB', e);
        return Response.json({ error: 'Sync failed' }, { status: 500 });
    }
}