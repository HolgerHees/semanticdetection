"use strict";

const Utils = require("./utils.js");
const Logger = require('./logger.js');

class Processor
{
    constructor(environment, numbers)
    {
        this.config = environment;
        this.numbers = numbers;
        this.commandGroupMap = {};

        this.initCommandGroupMap();
    }

    processPhrase(text, client_id)
    {
        let sub_cmds = text.toLowerCase().split(this.config.main.phrase_separator);

        let fallback_area = this.detectFallbackArea(client_id);

        let actions = [];
        for (let j = 0; j < sub_cmds.length; j++)
        {
            actions.push({
                // original phrase string related to this action
                "phrase": sub_cmds[j],
                // detected group
                "group": null,
                // detected area
                "area": null,
                // detected command
                "cmd": null,
                // detected command value like a percent value for a dimmer
                "cmd_value": null,
                // detected items
                "items": null,
                // i18n string for possible upcoming cmd_values
                "result_i18n": null,
                // i18n string to confirm this request
                "confirm_i18n": null,
                // any error message during the phrase processing
                "error": null
            });
        }

        // Detect groups like lights, sockets, shutters, other etc
        actions = this.detectGroups(actions);

        // Detect command like ON, OFF, UP, DOWN, READ, PERCENT (dimmer). Possible commands are depending on the previous detected group
        actions = this.detectCommands(actions);

        let _all_area_ids = [];

        // Detect area like livingroom, kitchen, floor, other. Possible areas are depending on the detected group too
        actions = this.detectAreas(actions, fallback_area, _all_area_ids);

        // Detect area_details like floor_og, floor_eg ... Possible area_details are depending on the detected group and area
        actions = this.detectAreaDetails(actions, _all_area_ids);

        // Detect items like livingroom couch light... Possible items are depending on the group, area and command
        actions = this.detectItems(actions);

        //Logger.info(actions);

        return actions;
    }

    detectGroups(actions)
    {
        let _all_area_ids = [];

        let _hasNonOtherGroup = false;

        let _actions = [];
        // detect GROUP (licht, dimmer, rolläden)
        for (let i = 0; i < actions.length; i++)
        {
            let action = actions[i];
            let group_data = this.findGroup(this.config.groups, action, []);

            action.group = group_data.id;
            action.result_i18n = group_data.i18n;

            if (action.group !== this.config.main.group_other)
            {
                _hasNonOtherGroup = true
            }

            _actions.push(action);
        }

        if( _hasNonOtherGroup )
        {
            // check "other" group. Is only possible in case that no "non other" group was detected
            for (let i = 0; i < _actions.length; i++) {
                let action = _actions[i];

                // validate "sonstiges" group. Is only valid if we find a area for it.
                if (action.group === this.config.main.group_other ) {
                    action.group = null;
                    action.result_i18n = null;
                }
            }
        }

        // fill GROUP backward
        let previousGroup = null;
        let previousResultI18N = null;
        for (let i = _actions.length - 1; i >= 0; i--)
        {
            let action = _actions[i];
            if (action.group == null)
            {
                action.group = previousGroup;
                action.result_i18n = previousResultI18N;
            }
            previousGroup = action.group;
            previousResultI18N = action.result_i18n;
        }

        // fill GROUP forward
        previousGroup = null;
        previousResultI18N = null;
        for (let i = 0; i < _actions.length; i++)
        {
            let action = _actions[i];
            if (action.group == null)
            {
                action.group = previousGroup;
                action.result_i18n = previousResultI18N;
            }
            previousGroup = action.group;
            previousResultI18N = action.result_i18n;
        }

        return _actions;
    }

    findGroup(group_configs, action, exclude_ids)
    {
        for (let i = 0; i < group_configs.length; i++)
        {
            let group_config = group_configs[i];

            if (Utils.isUndefined(group_config.phrase) || this.findPhrase(group_config.phrase, action, exclude_ids, false))
            {
                return group_config;
            }
        }

        return null;
    }

    detectCommands(actions)
    {
        // detect COMMAND
        for (let i = 0; i < actions.length; i++)
        {
            let action = actions[i];
            action.cmd = this.findCommand(this.config.commands, action);
        }

        // fill COMMAND backward
        let previousCommand = null;
        for (let i = actions.length - 1; i >= 0; i--)
        {
            let action = actions[i];

            // fill cmd's only if they are supported by this group (lights, shutters etc)
            if (action.cmd == null && previousCommand != null)
            {
                if (this.isCommandSupportedByGroup(previousCommand, action.group))
                {
                    action.cmd = previousCommand;
                }
                else
                {
                    previousCommand = null;
                }
            }
            previousCommand = action.cmd;
        }

        // fill COMMAND forward
        previousCommand = null;
        for (let i = 0; i < actions.length; i++)
        {
            let action = actions[i];

            // fill cmd's only if they are supported by this group (lights, shutters etc)
            if (action.cmd == null && previousCommand != null)
            {
                if (this.isCommandSupportedByGroup(previousCommand, action.group))
                {
                    action.cmd = previousCommand;
                }
                else
                {
                    previousCommand = null;
                }
            }
            previousCommand = action.cmd;
        }

        return actions;
    }

    findCommand(command_configs, action)
    {
        // Loop over possible cmd configs
        for (let i = 0; i < command_configs.length; i++)
        {
            let command_config = command_configs[i];

            // check if this cmd's are available for the current group (lights, shutters etc)
            if (!command_config.groups.includes(action.group))
            {
                continue;
            }

            // Loop over possible cmd's
            for (let j = 0; j < command_config.commands.length; j++)
            {
                let command = command_config.commands[j];

                if (Utils.isUndefined(command.phrase) || this.findPhrase(command.phrase, action, [], true))
                {
                    return command.id;
                }
            }
        }

        return null;
    }

    detectFallbackArea(client_id)
    {
        if (client_id != null)
        {
            for (let i = 0; i < this.config.clients.length; i++)
            {
                let client = this.config.clients[i];

                if (client.id === client_id)
                {
                    return client.area;
                }
            }
        }
        return null;
    }

    detectAreas(actions, fallback_area, _all_area_ids)
    {
        let _actions = [];

        // detect AREAS
        for (let i = 0; i < actions.length; i++)
        {
            let action = actions[i];
            if (action.area == null)
            {
                let found_areas = this.findAreas(this.config.areas, null, action, _all_area_ids);
                if (found_areas.length > 0)
                {
                    _actions = _actions.concat(this.fillAreas(found_areas, action));
                    continue;
                }

                found_areas = this.findAreas(this.config.areas, "fallback", action, _all_area_ids);
                if (found_areas.length > 0)
                {
                    _actions = _actions.concat(this.fillAreas(found_areas, action));
                    continue;
                }
            }
            _actions.push(action);
        }
        //Logger.info(_actions);

        // fill AREAS forward
        let previousArea = null;
        for (let i = 0; i < _actions.length; i++)
        {
            let action = _actions[i];
            if (action.area == null)
            {
                action.area = previousArea;
            }
            previousArea = action.area;
        }

        // fill AREAS backward
        previousArea = null;
        for (let i = _actions.length - 1; i >= 0; i--)
        {
            let action = _actions[i];
            if (action.area == null)
            {
                action.area = previousArea;
            }
            previousArea = action.area;
        }

        // fill AREAS with fallback_area based on device_id
        if (fallback_area != null)
        {
            for (let i = 0; i < _actions.length; i++)
            {
                let action = _actions[i];
                if (action.area == null)
                {
                    action.area = fallback_area;
                }
            }
        }

        return _actions;
    }

    detectAreaDetails(actions,_all_area_ids)
    {
        while(true)
        {
            let _actions = [];
            let _found = false;

            // detect AREAS
            for (let i = 0; i < actions.length; i++)
            {
                let action = actions[i];
                let found_areas = this.findAreas(this.config.areas, action.area, action, _all_area_ids);

                if (found_areas.length > 0)
                {
                    _found = true;
                    _actions = _actions.concat(this.fillAreas(found_areas, action));
                    continue;
                }
                _actions.push(action);
            }

            actions = _actions;

            if( !_found )
            {
                break;
            }
        }

        return actions;
    }

    findAreas(area_configs, current_area, action, exclude_ids)
    {
        let _areas = [];
        for (let i = 0; i < area_configs.length; i++)
        {
            let area_detail_config = area_configs[i];

            // check if this areas are available for the current group (lights, shutters etc)
            if (!area_detail_config.groups.includes(action.group))
            {
                continue;
            }

            for (let j = 0; j < area_detail_config.details.length; j++)
            {
                let details = area_detail_config.details[j];

                if (details.parent_area_id === current_area)
                {
                    for (let k = 0; k < details.sub_areas.length; k++)
                    {
                        let area_details = details.sub_areas[k];

                        if (this.findPhrase(area_details.phrase, action, exclude_ids, false))
                        {
                            _areas.push(area_details.id);
                            exclude_ids.push(area_details.id);
                        }
                    }
                }
            }
        }

        return _areas;
    }

    detectItems(actions)
    {
        for (let j = 0; j < actions.length; j++)
        {
            let action = actions[j];

            if (action.group == null || action.area == null || action.cmd == null)
            {
                action.items = [];

                if (action.cmd == null)
                {
                    action.error = this.config.i18n.no_cmd_found_in_phrase.replace("{phrase}", action.phrase);
                }
                else if (action.area == null)
                {
                    action.error = this.config.i18n.no_area_found_in_phrase.replace("{phrase}", action.phrase);
                }
                else
                {
                    action.error = this.config.i18n.nothing_found_in_phrase.replace("{phrase}", action.phrase);
                }
            }
            else
            {
                let devicesByGroup = this.config.actions[action.group];
                let foundDevices = [];
                for (let k = 0; k < devicesByGroup.length; k++)
                {
                    let device = devicesByGroup[k];

                    if (device.areas.includes(action.area) && device.cmds.includes(action.cmd))
                    {
                        foundDevices.push(device);
                    }
                }

                if (foundDevices.length === 1)
                {
                    action.items = foundDevices[0].items;

                    if (!Utils.isUndefined(foundDevices[0].i18n))
                    {
                        action.confirm_i18n = foundDevices[0].i18n;
                    }
                }
                else
                {
                    action.items = [];

                    if (foundDevices.length > 1)
                    {
                        action.error = this.config.i18n.too_much_found_in_phrase.replace("{phrase}", action.phrase);
                    }
                    else if (foundDevices.length === 0)
                    {
                        action.error = this.config.i18n.no_devices_found_in_phrase.replace("{phrase}", action.phrase);
                    }
                }
            }
        }

        return actions;
    }

    findPhrase(config_phrase, action, exclude_ids, set_value)
    {
        let cmd_phrase = action.phrase;

        if (typeof config_phrase === 'string')
        {
            // config phrase is a exclude "!<EXCLUDED_ID>"
            if (config_phrase.startsWith("!<") && config_phrase.endsWith(">"))
            {
                if (exclude_ids != null)
                {
                    return !exclude_ids.includes(config_phrase.substr(2, config_phrase.length - 3));
                }
                else
                {
                    Logger.error(">>>>>>>>>>exclude missing !!!!");
                }
            }
            // config phrase is a regex like "/REGEX/"
            else if (config_phrase.startsWith("/") && config_phrase.endsWith("/"))
            {
                let re = new RegExp(config_phrase.substr(1, config_phrase.length - 2));

                // set_value is currently only used to determine the value of a command like 50 %
                if (set_value)
                {
                    // "replace("ß","ss")" is a dirty hack, because "ß" seams to be not supported as a object key
                    let match = cmd_phrase.replace("ß", "ss").match(re);

                    if (match != null)
                    {
                        let value = match[1];
                        if (!Utils.isUndefined(this.numbers[value])) value = this.numbers[value];
                        if (!isNaN(value))
                        {
                            action.cmd_value = value;
                            return true;
                        }
                    }
                    return false;
                }
                else
                {
                    return cmd_phrase.search(re) !== -1;
                }
            }
            // config phrase is a text phrase
            else
            {
                // if its starts with an $, the phrase must be a single word or a beginning of a word
                let checkStart = config_phrase.startsWith("$");
                if (checkStart) config_phrase = config_phrase.substring(1);

                // if its end with an $, the phrase must be a single word or a end of a word
                let checkEnd = config_phrase.endsWith("$");
                if (checkEnd) config_phrase = config_phrase.substring(0, config_phrase.length - 1);

                // must be a single word
                if (checkStart && checkEnd)
                {
                    let re = new RegExp("\\b" + config_phrase + "\\b");
                    return cmd_phrase.search(re) !== -1;
                }
                // must be a single word or the beginning of a word
                else if (checkStart)
                {
                    let re = new RegExp("\\b" + config_phrase);
                    return cmd_phrase.search(re) !== -1;
                }
                // must be a single word or the end of a word
                else if (checkEnd)
                {
                    let re = new RegExp(config_phrase + "\\b");
                    return cmd_phrase.search(re) !== -1;
                }
                // can be everywhere
                else
                {
                    return cmd_phrase.indexOf(config_phrase) !== -1;
                }
            }
        }
        else if (typeof config_phrase === 'object')
        {
            let isOrCheck = config_phrase[0] === "OR";

            for (let i = 1; i < config_phrase.length; i++)
            {
                let check = this.findPhrase(config_phrase[i], action, exclude_ids, set_value);

                if (isOrCheck)
                {
                    if (check)
                    {
                        return true;
                    }
                }
                else
                {
                    if (!check)
                    {
                        return false;
                    }
                }
            }

            return !isOrCheck;
        }

        return false;
    }

    fillAreas(areas, action)
    {
        let _actions = [];
        for (let j = 0; j < areas.length; j++)
        {
            let _action = Object.assign({}, action);
            _action.area = areas[j];
            _action.area_autofill = false;
            _actions.push(_action);
        }
        return _actions;
    }

    initCommandGroupMap()
    {
        for (let i = 0; i < this.config.commands.length; i++)
        {
            let commands = this.config.commands[i];

            for (let j = 0; j < commands.commands.length; j++)
            {
                let command = commands.commands[j];

                for (let k = 0; k < commands.groups.length; k++)
                {
                    let group = commands.groups[k];

                    if (Utils.isUndefined(this.commandGroupMap[command.id])) this.commandGroupMap[command.id] = {};
                    this.commandGroupMap[command.id][group] = true;
                }
            }
        }
    }

    isCommandSupportedByGroup(cmd, group)
    {
        return !Utils.isUndefined(this.commandGroupMap[cmd][group])
    }
}

let PublicProcessor = (function ()
{
    let processor = null;

    function PublicProcessor(config, numbers)
    {
        processor = new Processor(config, numbers);
    }

    PublicProcessor.prototype.processPhrase = function (text, client_id)
    {
        return processor.processPhrase(text, client_id);
    };

    return PublicProcessor;
}());

module.exports = PublicProcessor;
