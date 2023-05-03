const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");

const dbConfig = require("./app/config/db-config");
const weatherRoute = require("./app/routes/weather-routes");

const app = express();
const originUri = process.env.CORS_ORIGIN || 'http://localhost:4200';
const corsOptions = {
    origin: `${originUri}`
};

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors(corsOptions));
app.use('/weather', weatherRoute);

// establish connection
mongoose.connect(dbConfig.uri, {useNewUrlParser: true, useUnifiedTopology: true})
    .then(() => console.log('Successfully connected to MongoDB at ...'))
    .catch(e => console.error('Failed connected to MongoDB...', e));

// test
app.get("/", (req, res) => {
    res.json({ message: "Health check" });
});

app.listen(process.env.PORT | 8080, () => {
    console.log("Server is started on post 9000");
});
