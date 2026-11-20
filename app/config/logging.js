const winston = require('winston');
const morgan = require('morgan');
const DailyRotateFile = require('winston-daily-rotate-file');

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

if (process.env.NODE_ENV !== 'PROD') {
    const fileAppender = new DailyRotateFile({
        filename: "logs/application-%DATE%.log",
        datePattern: "YYYY-MM-DD",
        zippedArchive: true,
        maxSize: "2m",
        maxFiles: "14d",
        format: winston.format.combine(
            winston.format.errors({ stack: true }),
            winston.format.timestamp(),
            winston.format.json(),
        ),
    });
    logger.add(fileAppender);
}

const morganMiddleware = morgan(
    ":method :url :status :res[content-length] - :response-time ms",
    {
        stream: {
            write: (message) => logger.http(message),
        },
    },
);

module.exports = { logger, morganMiddleware };