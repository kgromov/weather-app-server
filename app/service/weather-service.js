const mongoose = require("mongoose");
// ========== common stages ==========
const projectTemperaturesStage = {
    $project: {
        _id: null,
        month: {
            $month: "$date",
        },
        year: {
            $year: "$date",
        },
        minTemp: {
            $min: [
                "$morningTemperature",
                "$afternoonTemperature",
                "$eveningTemperature",
                "$nightTemperature",
            ],
        },
        maxTemp: {
            $max: [
                "$morningTemperature",
                "$afternoonTemperature",
                "$eveningTemperature",
                "$nightTemperature",
            ],
        },
        avgTemp: {
            $avg: [
                "$morningTemperature",
                "$afternoonTemperature",
                "$eveningTemperature",
                "$nightTemperature",
            ],
        },
    },
};
// =========== summary ==============
const DailyTemperature = require("../model/daily-temperature").DailyTemperature;
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

exports.getWeatherDayInRange = async function (day, years) {
    console.log(`Request params: day = ${day}, years = ${years}`);
    const date = new Date(day);
    const dayMonth = '-' + String((date.getMonth() + 1)).padStart(2, 0) + '-' + String(date.getDate()).padStart(2, '0');
    console.log(`dayMonth = ${dayMonth}`);

    var pipeline = [
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
    const result = await DailyTemperature.aggregate(pipeline);
    console.log(`weather for ${day} in ${years | 13} years: ${JSON.stringify(result)}`);
    return result;

}
exports.getYearsToShow = async function () {
    console.log('getYearsToShow');

    var pipeline = [
        // {
        //     $project: {
        //         date: {
        //             $toDecimal: "$date",
        //         },
        //     },
        // },
        {
            $group: {
                _id: null,
                min_date: {
                    $min: "$date",
                },
                max_date: {
                    $max: "$date",
                },
            },
        },
        {
            $project: {
                _id: 0,
                min_date: {
                    $toDate: "$min_date",
                },
                max_date: {
                    $toDate: "$max_date",
                },
                diff: {
                    $dateDiff: {
                        startDate: "$min_date",
                        endDate: "$max_date",
                        unit: "year",
                    },
                },
            },
        },
    ];

    var pipelineLocal = [
        {
            $group: {
                _id: null,
                min_date: {
                    $min: "$date",
                },
                max_date: {
                    $max: "$date",
                },
            },
        },
        {
            $project: {
                minYear: {
                    $year: "$min_date",
                },
                maxYear: {
                    $year: "$max_date",
                }
            },
        },
    ];
    const result = await DailyTemperature.aggregate(pipelineLocal);
    console.log('weather for ' + JSON.stringify(result) + ' years');
    return result[0].maxYear - result[0].minYear + 1;

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
                    ],
                    default: "Not found",
                },
            },
        },
    };

    const groupByYearSeasonStage = {
        $group: {
            _id: {
                year: "$year",
                season: "$season",
            },
            minTemp: {
                $min: "$minTemp",
            },
            maxTemp: {
                $max: "$maxTemp",
            },
            avgTemp: {
                $avg: "$avgTemp",
            }
        }
    };

    const aggregateSeasonsByYear = {
        $group: {
            _id: "$_id.year",
            seasons: {
                $push: {
                    season: "$_id.season",
                    minTemp: "$minTemp",
                    maxTemp: "$maxTemp",
                    avgTemp: "$avgTemp",
                },
            },
        },
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
        projectTemperaturesStage,
        projectSeasonStage,
        groupByYearSeasonStage,
        aggregateSeasonsByYear,
        finalMappingStage,
        sortByYearStage
    ];
    const result = await DailyTemperature.aggregate(pipeline);
    console.log('Seasons temperature ' + JSON.stringify(result) + ' by years');
    return result;

}

exports.getYearsSummary = async function () {

    const projectTemperaturesStage = {
        $project: {
            _id: null,
            year: {
                $year: "$date",
            },
            minTemp: {
                $min: [
                    "$morningTemperature",
                    "$afternoonTemperature",
                    "$nightTemperature",
                ]
            },
            maxTemp: {
                $max: [
                    "$morningTemperature",
                    "$afternoonTemperature",
                    "$nightTemperature",
                ]
            },
            avgTemp: {
                $avg: [
                    "$morningTemperature",
                    "$afternoonTemperature",
                    "$nightTemperature",
                ]
            }
        }
    };

    const groupByYearStage = {
        $group: {
            _id: {
                year: "$year"
            },
            minTemp: {
                $min: "$minTemp",
            },
            maxTemp: {
                $max: "$maxTemp",
            },
            avgTemp: {
                $avg: "$avgTemp",
            }
        }
    };

    const removeIdStage = {
        $project: {
            _id: 0,
            year: "$_id.year",
            min: "$minTemp",
            max: "$maxTemp",
            avg: "$avgTemp",
        },
    };

    const sortByYearStage = {
        $sort: {year: 1}
    };

    const pipeline = [
        projectTemperaturesStage,
        groupByYearStage,
        removeIdStage,
        sortByYearStage
    ];
    const result = await DailyTemperature.aggregate(pipeline);
    console.log('Temperature ' + JSON.stringify(result) + ' by years');
    return result;


}

exports.getYearsByMonthsTemperature = async function () {
    const groupBuMonthAndYearStage = {
        $group: {
            _id: {
                year: "$year",
                month: "$month",
            },
            minTemp: {
                $min: "$minTemp",
            },
            maxTemp: {
                $max: "$maxTemp",
            },
            avgTemp: {
                $avg: "$avgTemp",
            },
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
                    avgTemp: "$avgTemp",
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
        $sort: {
            year: 1,
        },
    };

    const pipeline = [
        projectTemperaturesStage,
        groupBuMonthAndYearStage,
        groupByYearStage,
        removeIdStage,
        sortByYearStage
    ];

    const result = await DailyTemperature.aggregate(pipeline);
    console.log('Months temperature ' + JSON.stringify(result) + ' by years');
    return result;
}


