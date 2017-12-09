"use strict";

let LEVEL = [
    'DEBUG',
    'INFO',
    'WARN',
    'ERROR',
];

let DEFAULT = 'DEBUG';

class Logger
{
    static log(level, message)
    {
        let currentLevel = LEVEL.indexOf(process.env.LOG_LEVEL ? process.env.LOG_LEVEL : DEFAULT);

        if (LEVEL.indexOf(level) < currentLevel) return;

        switch (level)
        {
            case 'INFO':
                console.info(message);
                break;
            case 'WARN':
                console.warn(message);
                break;
            case 'ERROR':
                console.error(message);
                break;
            default:
                console.log(message);
                break;
        }
    }
}

module.exports.debug = function (message)
{
    Logger.log('DEBUG', message);
};
module.exports.info = function (message)
{
    Logger.log('INFO', message);
};
module.exports.warn = function (message)
{
    Logger.log('WARN', message);
};
module.exports.error = function (message)
{
    Logger.log('ERROR', message);
};