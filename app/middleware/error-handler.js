const {logger} = require("./../config/logging");

module.exports = function (err, req, res, next) {
    logger.error(err);
    res.status(500).send(`Something went wrong: ${err.message}`);
}

