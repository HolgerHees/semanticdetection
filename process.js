"use strict";
const Processor = require("./classes/processor.js");
const Validator = require("./classes/validator.js");
const Utils = require("./classes/utils.js");

const numbers = require("./data/numbers.js");

const environment = require("./config/environment.js");

const tests = require("./config/test.js");

let cmds = tests.enabled;

let start = getNanoSecTime();

let processor = new Processor(environment, numbers);

for (let i = 0; i < cmds.length; i++)
{
    let text = cmds[i].phrase;

    let actions = processor.processPhrase(text, Utils.isUndefined(cmds[i].client_id) ? null : cmds[i].client_id);

    Validator.validateResult(actions, cmds[i].items, text);
}

let end = getNanoSecTime();
console.log((end - start) / 1000 / 1000);

function getNanoSecTime()
{
    let hrTime = process.hrtime();
    return hrTime[0] * 1000000000 + hrTime[1];
}
