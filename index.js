'use strict';
const Alexa = require('alexa-sdk');

const Rest = require('./classes/rest.js');
const Openhab = require("./classes/openhab.js");
const Processor = require("./classes/processor.js");
const Utils = require("./classes/utils.js");

const numbers = require("./data/numbers.js");

const environment = require("./config/environment.js");
const config = require("./config/openhab.js");

let rest = new Rest(config);
let openhab = new Openhab(rest);
let processor = new Processor(environment, numbers);

const APP_ID = "amzn1.ask.skill.e8230080-ee50-43aa-9f69-fc1b687665d6";

exports.handler = function (event, context, callback)
{
    var alexa = Alexa.handler(event, context, callback);
    alexa.appId = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

const handlers = {
    'LaunchRequest': function ()
    {
        //this.emit('GetNewFactIntent');
    },
    'ProcessPhrase': function ()
    {

        let phrase = this.event.request.intent.slots.CatchAll.value;

        if (phrase === environment.main.phrase_stop)
        {
            this.emit(':responseReady');
            return;
        }

        //console.log(this.event.context.System.device.deviceId);
        //this.response.speak(this.event.context.System.device.deviceId);
        //this.emit(':responseReady');
        //return;
        
        let actions = processor.processPhrase(phrase, this.event.context.System.device.deviceId);

        let self = this;

        openhab.processActions(actions, function (itemCount, success_messages, error_messages)
        {
            // check for default error message if nothing was found
            if (itemCount === 0)
            {
                if (error_messages.length === 0) error_messages.push(environment.i18n.nothing_found);
            }
            // add default success message if there was no other success message
            else
            {
                if (success_messages.length === 0) success_messages.push(environment.i18n.ok_message);
            }

            // combine all messages to a "final" message string
            let messages = [];
            if (success_messages.length > 0)
            {
                messages = messages.concat(success_messages.join(environment.i18n.message_join_separator));
            }
            if (error_messages.length > 0)
            {
                if (messages.length > 0) messages.push(environment.i18n.message_error_separator);
                messages = messages.concat(error_messages.join(environment.i18n.message_join_separator));
            }

            let message = Utils.capitalizeFirstLetter(messages.join(""));

            // in case of an error ask for "more"
            if (error_messages.length > 0)
            {
                self.response.speak(message).listen(Utils.capitalizeFirstLetter(itemCount === 0 ? environment.i18n.ask_to_repeat_everything : environment.i18n.ask_to_repeat_part));
            }
            else
            {
                self.response.speak(message);
            }

            self.emit(':responseReady');
        });

    },
    'Unhandled': function ()
    {
        this.emit(':responseReady');
    },
    'AMAZON.HelpIntent': function ()
    {
        this.response.speak(environment.i18n.help_message).listen(environment.i18n.help_ask_message);
        this.emit(':responseReady');
    },
    'AMAZON.CancelIntent': function ()
    {
        this.emit(':responseReady');
    },
    'AMAZON.StopIntent': function ()
    {
        this.emit(':responseReady');
    },
};
