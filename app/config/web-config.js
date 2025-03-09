const profile = process.env.NODE_ENV;
const originUri = process.env.CORS_ORIGIN;
const localCorsUri = 'http://localhost:4200';
const weatherURL = process.env.WEATHER_URL;

module.exports = {
    originUri: profile === 'PROD' ? originUri : localCorsUri,
    weatherURL: weatherURL,
}