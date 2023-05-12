const logger = require('./../startup/logging');
const http = require('http');
const https = require('https');
const URL = require('url');

exports.get = function(url) {
    logger.debug(`GET by url = ${url}`);
    return new Promise((resolve, reject) => {
        let client = http;
        // const urlInfo = URL.parse(url, true);
        // if (urlInfo.protocol === 'https') {
        if (url.toString().indexOf("https") === 0) {
            client = https;
        }

        client.get(url, (resp) => {
            let chunks = [];

            // A chunk of data has been recieved.
            resp.on('data', (chunk) => {
                chunks.push(chunk);
            });

            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                resolve(Buffer.concat(chunks).toString('utf-8'));
            });

        }).on("error", (err) => {
            reject(err);
        });
    });
}

