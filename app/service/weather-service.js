// ========== common stages ==========
const avgTemperaturesStage = {
    $round: [
        {
            $avg: [
                "$avg",
            ]
        },
        2
    ]
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
// =========== summary ==============
const DailyTemperature = require("../model/daily-temperature").DailyTemperature;

// data methods
exports.getDailyWeatherInYears = async function (day, years) {
    console.log(`Request params: day = ${day}, years = ${years}`);
    const date = new Date(day);
    const dayMonth = '-' + String((date.getMonth() + 1)).padStart(2, 0) + '-' + String(date.getDate()).padStart(2, '0');
    console.log(`dayMonth = ${dayMonth}`);

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
    console.log(`${JSON.stringify(pipeline, null, 2)}`);
    const result = await DailyTemperature.aggregate(pipeline);
    console.log(`weather for ${day} in ${years | 13} years: ${JSON.stringify(result)}`);
    return result;

}

exports.getMonthWeather = async function (y, m) {
    const year = parseInt(y, 10);
    const month = parseInt(m, 10);
    console.log(`getMonthWeather: request params: month = ${month}, year = ${year}`);
    const from = new Date(Date.UTC(year, month, 1));
    const to = new Date(Date.UTC(year, month + 1, 1));
    console.log(`date range for month: [${from}; ${to}]`);

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
    console.trace(`${JSON.stringify(pipeline, null, 2)}`);
    const result = await DailyTemperature.aggregate(pipeline);
    console.log(`weather for ${from.toLocaleString('default', {month: 'long'})}, ${year}: ${JSON.stringify(result)}`);
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
        groupByMonthAndYearStage,
        extremumDatesStage,
        removeDaysStage,
        groupByYearStage,
        removeIdStage,
        sortByYearStage
    ];

    const result = await DailyTemperature.aggregate(pipeline);
    console.log('Months temperature ' + JSON.stringify(result) + ' by years');
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

    const aggregateSeasonsByYear =  {
        $group: {
            _id: "$_id.year",
            seasons: {
                $push: {
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

    const finalMappingStage = {
        $project: {
            _id: 0,
            year: "$_id",
            seasons: 1,
        },
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
        finalMappingStage,
        sortByYearStage
    ];
    const result = await DailyTemperature.aggregate(pipeline);
    console.log('Seasons temperature ' + JSON.stringify(result) + ' by years');
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
            year: "$_id",
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
    console.log('Temperature ' + JSON.stringify(result) + ' by years');
    return result;
}

// service methods
exports.getYearsToShow = async function () {
    console.log('getYearsToShow');
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
    console.log('weather for ' + JSON.stringify(result) + ' years');
    return result[0].maxYear - result[0].minYear + 1;
}

// others
exports.getWeatherForToday = async function () {
    const currentDate = new Date().toISOString()/*.slice(0, 10)*/;
    const result = await DailyTemperature.findOne({data: currentDate});
    console.log(`weather for ${currentDate}: ${result}`);
    return result;
}

exports.getWeatherAtDay = async function (day) {
    const result = await DailyTemperature.findOne({data: new Date(day)});
    console.log(`weather for ${day}: ${result}`);
    return result;
}