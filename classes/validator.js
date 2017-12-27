"use strict";

class Validator
{
    static validateResult(actions, needed_items, text)
    {
        let _check = {};
        let current_available_items = [];
        let current_missing_items = [];
        for (let i = 0; i < actions.length; i++)
        {
            let action = actions[i];

            if (action.items.length === 0)
            {
                current_missing_items.push(action);
            }
            else
            {
                for (let k = 0; k < action.items.length; k++)
                {
                    let item = action.items[k];
                    if (typeof _check[item] === "undefined")
                    {
                        _check[item] = true;
                        current_available_items.push([item, action.cmd]);
                    }
                }
            }
        }

        let expected_available_items = [];
        let expected_missing_items = [];
        for (let i = 0; i < needed_items.length; i++)
        {
            let item = needed_items[i];

            if (item[0] === null)
            {
                expected_missing_items.push(item);
            }
            else
            {
                expected_available_items.push(item);
            }
        }

        if (current_available_items.length !== expected_available_items.length || current_missing_items.length !== expected_missing_items.length)
        {
            console.log("-------------");
            console.log(text);
            console.log("actions:");
            console.log(actions);
            console.log("current_available_items:");
            console.log(current_available_items);
            console.log("expected_available_items:");
            console.log(expected_available_items);
            console.log("current_missing_items:");
            console.log(current_missing_items);
            console.log("expected_missing_items:");
            console.log(expected_missing_items);
            throw "Found item count mismatch";
        }
        else
        {
            for (let j = 0; j < current_available_items.length; j++)
            {
                let current_item = current_available_items[j];
                let found = false;

                for (let k = 0; k < expected_available_items.length; k++)
                {
                    let expected_item = expected_available_items[k];

                    if (expected_item[0] === current_item[0] && expected_item[1] === current_item[1])
                    {
                        found = true;
                        break;
                    }
                }

                if (!found)
                {
                    console.log("-------------");
                    console.log(text);
                    console.log("actions:");
                    console.log(actions);
                    console.log("current_available_items:");
                    console.log(current_available_items);
                    console.log("expected_available_items:");
                    console.log(expected_available_items);
                    throw "Item not found";
                }
            }
        }

        let message = "'" + text + "' ... processed";
        if (current_available_items.length > 0) message += " and " + current_available_items.length + " found";
        if (current_missing_items.length > 0) message += " and " + current_missing_items.length + " missing";

        console.log(message);
    }
}

module.exports.validateResult = Validator.validateResult;