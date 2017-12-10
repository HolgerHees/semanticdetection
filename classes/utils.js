"use strict";

function capitalizeFirstLetter(string)
{
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function isUndefined(obj)
{
    return typeof obj === "undefined";
}


module.exports.capitalizeFirstLetter = capitalizeFirstLetter;
module.exports.isUndefined = isUndefined;
