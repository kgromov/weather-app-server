const MS_PER_DAY = 1000 * 60 * 60 * 24;

exports.getDatesDiffInDays = function (from, to) {
    const utc1 = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
    const utc2 = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
    return Math.floor(Math.abs(utc2 - utc1) / MS_PER_DAY);
}

exports.addDays = function (date, days) {
    const resultDate = new Date(date);
    resultDate.setDate(resultDate.getDate() + days);
    return resultDate;
}
