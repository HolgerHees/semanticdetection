"use strict";

function capitalizeFirstLetter(string)
{
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function isUndefined(obj)
{
    return typeof obj === "undefined";
}

function getNanoSecTime()
{
    let hrTime = process.hrtime();
    return hrTime[0] * 1000000000 + hrTime[1];
}

module.exports.capitalizeFirstLetter = capitalizeFirstLetter;
module.exports.isUndefined = isUndefined;
module.exports.getNanoSecTime = getNanoSecTime;
