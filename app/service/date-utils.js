const MS_PER_DAY = 1000 * 60 * 60 * 24;

exports.getDatesDiffInDays = function (from, to) {
    const utc1 = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
    const utc2 = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
    console.log(`Calculate days between UTC dates: ${new Date(utc2)} - ${new Date(utc1)}`);
    return Math.floor(Math.abs(utc2 - utc1) / MS_PER_DAY);
    // return Math.floor(Math.abs(from.getTime() - to.getTime()) / MS_PER_DAY);
}

exports.addDays = function (date, days) {
    const resultDate = new Date(date);
    resultDate.setDate(resultDate.getDate() + days);
    return resultDate;
}

exports.formatToISODate = function(date) {
    return date.toISOString().slice(0, 10);
}
