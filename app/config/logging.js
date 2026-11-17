const winston = require('winston');

const logLevels = {
    error: 0,
    warning: 1,
    info: 2,
    http: 3,
    debug: 4,
    trace: 4,
};

const logger = winston.createLogger({
    levels: logLevels,
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.errors({ stack: true }),
        winston.format.timestamp({
            format: "YYYY-MM-DD hh:mm:ss.SSS A",
        }),
        winston.format.printf(
            ({ timestamp, level, message, stack }) => {
                return `${timestamp} ${level}: ${message} ${stack || ""}`;
            },
        ),
    ),
    transports: [new winston.transports.Console()],
});

module.exports = logger;