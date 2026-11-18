const {logger} = require("../config/logging");

// ========== common stages ==========
const avgTemperaturesStage = {
    $round: [{$avg: ["$avg"]}, 2]
};

const projectToMonthWithDateStage = {
    $project: {
        _id: 0,
        date: 1,
        month: {$month: "$date"},
        year: {$year: "$date"},
        minTemp: {$min: ["$min"]},
        maxTemp: {$max: ["$max"]},
        avgTemp: {$avg: ["$avg"]}
    }
};

const extremumDatesStage = {
    $addFields: {
        maxTempDates: {
            $map: {
                input: {
                    $filter: {
                        input: "$days",
                        as: "d",
                        cond: {$eq: ["$$d.maxTemp", "$maxTemp"]}
                    }
                },
                as: "d",
                in: "$$d.date"
            }
        },
        minTempDates: {
            $map: {
                input: {
                    $filter: {
                        input: "$days",
                        as: "d",
                        cond: {$eq: ["$$d.minTemp", "$minTemp"]}
                    }
                },
                as: "d",
                in: "$$d.date"
            }
        }
    }
};

const removeDaysStage =  {
    $project: { days: 0 }
};

const sortDates =  {
    $sort: { date: 1 }
};
// =========== summary ==============
const DailyTemperature = require("../model/daily-temperature").DailyTemperature;

// data methods
exports.getDailyWeatherInYears = async function (day, years) {
    logger.http(`Request params: day = ${day}, years = ${years}`);
    const date = new Date(day);
    const dayMonth = '-' + String((date.getMonth() + 1)).padStart(2, 0) + '-' + String(date.getDate()).padStart(2, '0');
    logger.debug(`dayMonth = ${dayMonth}`);

    const pipeline = [
        {
            $project: {
                _id: 0,
                morningTemperature: 1,
                afternoonTemperature: 1,
                eveningTemperature: 1,
                nightTemperature: 1,
                date: {
                    $dateToString: {
                        date: "$date",
                        format: "%Y-%m-%d",

                    }
                }
            }
        },
        {
            $match: {
                date: {$regex: dayMonth}
            }
        },
        {$sort: {date: -1}},
        {$limit: +years || Number.MAX_SAFE_INTEGER}
    ];
    logger.debug(`${JSON.stringify(pipeline, null, 2)}`);
    const result = await DailyTemperature.aggregate(pipeline);
    logger.http(`weather for ${day} in ${years | 13} years: ${JSON.stringify(result)}`);
    return result;

}

exports.getMonthWeather = async function (y, m) {
    const year = parseInt(y, 10);
    const month = parseInt(m, 10);
    logger.http(`getMonthWeather: request params: month = ${month}, year = ${year}`);
    const from = new Date(Date.UTC(year, month, 1));
    const to = new Date(Date.UTC(year, month + 1, 1));
    logger.info(`date range for month: [${from}; ${to}]`);

    const pipeline = [
        {
            $match: {
                date: {
                    $gte: from,
                    $lt: to
                }
            }
        },
        {
            $project: {
                _id: 0,
                day: {$dayOfMonth: "$date"},
                minTemp: {$min: ["$min"]},
                maxTemp: {$max: ["$max"]},
                avgTemp: avgTemperaturesStage
            }
        },
        {
            $sort: {day: 1}
        }
    ];
    logger.debug(`${JSON.stringify(pipeline, null, 2)}`);
    const result = await DailyTemperature.aggregate(pipeline);
    logger.http(`weather for ${from.toLocaleString('default', {month: 'long'})}, ${year}: ${JSON.stringify(result)}`);
    return result;
}

exports.getYearsByMonthsTemperature = async function () {
    const groupByMonthAndYearStage = {
        $group: {
            _id: {
                year: "$year",
                month: "$month",
            },
            minTemp: {$min: "$minTemp"},
            maxTemp: {$max: "$maxTemp"},
            avgTemp: {$avg: "$avgTemp"},
            days: {
                $push: {
                    date: "$date",
                    minTemp: "$minTemp",
                    maxTemp: "$maxTemp"
                }
            }
        },
    };

    const groupByYearStage = {
        $group: {
            _id: "$_id.year",
            months: {
                $push: {
                    month: "$_id.month",
                    minTemp: "$minTemp",
                    maxTemp: "$maxTemp",
                    avgTemp: { $round: ["$avgTemp", 2] },
                    minTempDates: "$minTempDates",
                    maxTempDates: "$maxTempDates"
                },
            },
        },
    };

    const sortMonthsStage = {
        $set: {
            months: {
                $sortArray: {input: "$months", sortBy: {month: 1}}
            }
        }
    };

    const removeIdStage = {
        $project: {
            _id: 0,
            year: "$_id",
            months: 1
        },
    };

    const sortByYearStage = {
        $sort: {year: 1},
    };

    const pipeline = [
        projectToMonthWithDateStage,
        sortDates,
        groupByMonthAndYearStage,
        extremumDatesStage,
        removeDaysStage,
        groupByYearStage,
        sortMonthsStage,
        removeIdStage,
        sortByYearStage
    ];

    const result = await DailyTemperature.aggregate(pipeline);
    logger.http('Months temperature ' + JSON.stringify(result) + ' by years');
    return result;
}

exports.getYearsBySeasonsTemperature = async function () {
    const projectSeasonStage = {
        $addFields: {
            season: {
                $switch: {
                    branches: [
                        {
                            case: {
                                $or: [
                                    {
                                        $eq: ["$month", 1],
                                    },
                                    {
                                        $eq: ["$month", 2],
                                    },
                                    {
                                        $eq: ["$month", 12],
                                    }
                                ]
                            },
                            then: "WINTER",
                        },
                        {
                            case: {
                                $and: [
                                    {
                                        $gt: ["$month", 2],
                                    },
                                    {
                                        $lt: ["$month", 6],
                                    }
                                ]
                            },
                            then: "SPRING",
                        },
                        {
                            case: {
                                $and: [
                                    {
                                        $gt: ["$month", 5],
                                    },
                                    {
                                        $lt: ["$month", 9],
                                    }
                                ]
                            },
                            then: "SUMMER",
                        },
                        {
                            case: {
                                $and: [
                                    {
                                        $gt: ["$month", 8],
                                    },
                                    {
                                        $lt: ["$month", 12],
                                    }
                                ]
                            },
                            then: "AUTUMN",
                        },
                    ]
                },
            },
        },
    };

    const groupByYearSeasonStage = {
        $group: {
            _id: { year: "$year", season: "$season" },
            minTemp: { $min: "$minTemp" },
            maxTemp: { $max: "$maxTemp" },
            avgTemp: { $avg: "$avgTemp" },
            days: {
                $push: {
                    date: "$date",
                    minTemp: "$minTemp",
                    maxTemp: "$maxTemp"
                }
            }
        }
    };

    const SEASON_ORDERED = ["WINTER", "SPRING", "SUMMER", "AUTUMN"];
    const aggregateSeasonsByYear =  {
        $group: {
            _id: "$_id.year",
            seasons: {
                $push: {
                    order: {$indexOfArray: [SEASON_ORDERED, "$_id.season"]},
                    season: "$_id.season",
                    minTemp: "$minTemp",
                    maxTemp: "$maxTemp",
                    avgTemp: { $round: ["$avgTemp", 2] },
                    minTempDates: "$minTempDates",
                    maxTempDates: "$maxTempDates"
                }
            }
        }
    };

    const sortSeasonsStage = {
        $set: {
            seasons: {
                $sortArray: {input: "$seasons", sortBy: {order: 1}}
            }
        }
    };

    const removeIdStage = {
        $project: {
            _id: 0,
            year: "$_id",
            seasons: 1,
        },
    };

    const dropOrderStage = {
        $project: {"seasons.order": 0}
    };

    const sortByYearStage = {
        $sort: {year: 1}
    };

    const pipeline = [
        projectToMonthWithDateStage,
        projectSeasonStage,
        groupByYearSeasonStage,
        extremumDatesStage,
        removeDaysStage,
        aggregateSeasonsByYear,
        sortSeasonsStage,
        removeIdStage,
        dropOrderStage,
        sortByYearStage
    ];
    const result = await DailyTemperature.aggregate(pipeline);
    logger.http('Seasons temperature ' + JSON.stringify(result) + ' by years');
    return result;

}

exports.getYearsSummary = async function() {
    const groupByYearStage =  {
        $group: {
            _id: { year: "$year" },
            minTemp: { $min: "$minTemp" },
            maxTemp: { $max: "$maxTemp" },
            avgTemp: { $avg: "$avgTemp" },
            days: {
                $push: {
                    date: "$date",
                    minTemp: "$minTemp",
                    maxTemp: "$maxTemp"
                }
            }
        }
    };

    const removeIdStage = {
        $project: {
            _id: 0,
            year: "$_id.year",
            min: "$minTemp",
            max: "$maxTemp",
            avg: {$round: ["$avgTemp", 2]},
            minTempDates: 1,
            maxTempDates: 1
        }
    };

    const sortByYearStage = {
        $sort: {year: 1}
    };

    const pipeline = [
        projectToMonthWithDateStage,
        groupByYearStage,
        extremumDatesStage,
        removeDaysStage,
        removeIdStage,
        sortByYearStage
    ];
    const result = await DailyTemperature.aggregate(pipeline);
    logger.http('Temperature ' + JSON.stringify(result) + ' by years');
    return result;
}

// service methods
exports.getYearsToShow = async function () {
    const pipelineLocal = [
        {
            $group: {
                _id: null,
                min_date: {$min: "$date"},
                max_date: {$max: "$date"},
            },
        },
        {
            $project: {
                minYear: {$year: "$min_date"},
                maxYear: {$year: "$max_date"}
            },
        },
    ];
    const result = await DailyTemperature.aggregate(pipelineLocal);
    logger.http('weather for ' + JSON.stringify(result) + ' years');
    return result[0].maxYear - result[0].minYear + 1;
}

// others
exports.getWeatherForToday = async function () {
    const currentDate = new Date().toISOString()/*.slice(0, 10)*/;
    const result = await DailyTemperature.findOne({data: currentDate});
    logger.http(`weather for ${currentDate}: ${result}`);
    return result;
}

exports.getWeatherAtDay = async function (day) {
    const result = await DailyTemperature.findOne({data: new Date(day)});
    logger.http(`weather for ${day}: ${result}`);
    return result;
}