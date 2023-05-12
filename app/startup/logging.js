const winston = require('winston');
require('winston-mongodb');
require('express-async-errors');

const dbName = process.env.DB_NAME || 'test';
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const profile = process.env.NODE_ENV;
const localUrl = `mongodb://localhost:27017/${dbName}`;
const clusterUrl = `mongodb+srv://${dbUser}:${dbPassword}@cluster0.kxhtq.mongodb.net/${dbName}`;
const uri = profile === 'prod' ? clusterUrl: localUrl;
const logLevel = profile === 'prod' ? 'info' : 'debug';

// configure and export own logger - is preferable option
const logger = winston.createLogger({
    level: logLevel,
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({filename: 'logs/logfile.log'}),
        new winston.transports.MongoDB( {
            db: uri
        })
    ],
    format: winston.format.combine(
        winston.format.uncolorize(),
        winston.format.simple()
    ),
    handleExceptions: true,
    handleRejections: true,
    exceptionHandlers: [
        new winston.transports.File({ filename: 'logs/error.log' }),
        new winston.transports.MongoDB( {
            db: uri
        })
    ],
    rejectionHandlers: [
        new winston.transports.File({ filename: 'logs/error.log' }),
        new winston.transports.MongoDB( {
            db: uri
            // collection: 'error'
        })
    ]
});

module.exports = logger;

// another approach - configure default winston loader
/*module.exports = function () {
    const logLevel = process.env.NODE_ENV === 'prod' ? 'info' : 'debug';
    const fileAppender = new winston.transports.File({level: logLevel, filename: 'logs/logfile.log'});
    const consoleAppender = new winston.transports.Console({level: logLevel, colorize: true, prettyPrint: true});
    // in order to store to logs to db (aka appender in sl4j)
    /!* const mongoDbAppender = new winston.transports.MongoDB( {
        db: 'mongodb://localhost/test',
        level: 'info'
    });
*!/
    winston.add(consoleAppender);
    winston.add(fileAppender);
    // winston.add(mongoDbAppender);

    winston.exceptions.handle(
        consoleAppender,
        fileAppender
    );

    // simply not working
    // winston.handleRejections(
    /!*winston.rejections.handle(
        consoleAppender,
        fileAppender
    );*!/

    // old workaround to handle rejections (async errors)
    process.on('unhandledRejection', (ex) => {
        throw ex;
    });
}*/
