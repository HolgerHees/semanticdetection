"use strict";

let logger = require('./logger');

class Openhab
{
    constructor(rest)
    {
        this.rest = rest;
    }

    processActions(actions, done_func)
    {
        let requestCount = 1;
        let itemCount = 0;

        let success_messages = [];
        let error_messages = [];

        let finish = function ()
        {
            requestCount--;
            if (requestCount === 0) done_func(itemCount, success_messages, error_messages);
        };

        let successGet = function (response, action)
        {
            let message = action.result_i18n == null ? response.state : action.result_i18n.replace("{area}", response.label).replace("{value}", response.state.replace(".", ","));
            success_messages.push(message);
            finish();
        };

        let successPost = function (response, action)
        {
            if (action.confirm_i18n != null) success_messages.push(action.confirm_i18n);
            finish();
        };

        let failureRequest = function (error, action)
        {
            logger.error(error);
            logger.error(action);

            finish();
        };

        let failureData = function (action)
        {
            //logger.error(action.error);

            error_messages.push(action.error);

            finish();
        };

        for (let i = 0; i < actions.length; i++)
        {
            let action = actions[i];

            if (action.error != null)
            {
                requestCount++;

                failureData(action);
            }
            else
            {
                let cmd = null;

                switch (action.cmd)
                {
                    case "ACTION_ON":
                    case "DEFAULT_ON":
                        cmd = "ON";
                        break;
                    case "ACTION_OFF":
                        cmd = "OFF";
                        break;
                    case "ACTION_UP":
                        cmd = "UP";
                        break;
                    case "ACTION_DOWN":
                        cmd = "DOWN";
                        break;
                    case "ACTION_PERCENT":
                        cmd = action.cmd_value;
                        break;
                    case "READ_VALUE":
                        cmd = "READ";
                        break;
                }

                if (cmd !== null)
                {
                    for (let j = 0; j < action.items.length; j++)
                    {
                        requestCount++;
                        itemCount++;

                        let item = action.items[j];

                        if (cmd === "READ")
                        {
                            this.rest.getItem(item, successGet, failureRequest, action);
                        }
                        else
                        {
                            this.rest.postItemCommand(item, cmd, successPost, failureRequest, action);
                        }
                    }
                }
            }
        }

        finish();
    }
}

let PublicOpenhab = (function ()
{
    let openhab = null;

    function PublicOpenhab(rest)
    {
        openhab = new Openhab(rest);
    }

    PublicOpenhab.prototype.processActions = function (actions, done_func)
    {
        return openhab.processActions(actions, done_func);
    };

    return PublicOpenhab;
}());

module.exports = PublicOpenhab;
