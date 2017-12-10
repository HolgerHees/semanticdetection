"use strict";
const Processor = require("./classes/processor.js");
const Validator = require("./classes/validator.js");
const Utils = require("./classes/utils.js");

const numbers = require("./data/numbers.js");

const environment = require("./config/environment.js");

const tests = require("./config/test.js");

let start = Utils.getNanoSecTime();

let processor = new Processor(environment, numbers);

let cmds = tests.enabled;

for (let i = 0; i < cmds.length; i++)
{
    let cmd = cmds[i];

    let actions = processor.processPhrase(cmd.phrase, Utils.isUndefined(cmd.client_id) ? null : cmd.client_id);

    Validator.validateResult(actions, cmd.items, cmd.phrase);
}

let end = Utils.getNanoSecTime();
console.log((end - start) / 1000 / 1000);


