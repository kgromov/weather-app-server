const http = require('http');
const https = require('https');

exports.get = function (url) {
    console.log('GET by url = ', url);

    return new Promise((resolve, reject) => {
        const client = url.toString().indexOf("https") === 0 ? https : http;

        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
            timeout: 5000, // fail fast instead of hanging into Vercel's limit
            family: 4
        };

        const req = client.get(url, options, (resp) => {
            if (resp.statusCode < 200 || resp.statusCode >= 300) {
                resp.resume(); // drain to free memory
                reject(new Error(`Request failed with status ${resp.statusCode} for ${url}`));
                return;
            }

            const chunks = [];

            resp.on('data', (chunk) => {
                chunks.push(chunk);
            });

            resp.on('end', () => {
                resolve(Buffer.concat(chunks).toString('utf-8'));
            });

            // Catches connection resets mid-stream — this was the missing handler
            resp.on('error', (err) => {
                reject(err);
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.on('timeout', () => {
            req.destroy(new Error(`Request timed out after ${options.timeout}ms for ${url}`));
        });
    });
};

