'use strict';
//const Alexa = require('alexa-sdk');
const Alexa = require('ask-sdk-v1adapter');

const Rest = require('./classes/rest.js');

const config = require("./config/openhab.js");
let logger = require('./classes/logger');

let rest = new Rest(config);

const APP_ID = "amzn1.ask.skill.e8230080-ee50-43aa-9f69-fc1b687665d6";

let https = require('https');

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
    'ProcessPhrase': function (intent)
    {
        //console.log("---Phrase---");
        //console.log(intent);
        //console.log(this.event);
        //console.log(this.event.request.intent.slots);
        //console.log("------");

        let phrase = this.event.request.intent.slots.CatchAll.value;
        let client_id = this.event.context.System.device.deviceId;
        
        function getItemSuccess(response,alexa) {
            //logger.info('getItemSuccess ' + response );
            //logger.info(response);
          
            alexa.response.speak(response.state);
            alexa.emit(':responseReady');
        }
        function postItemSuccess(response,alexa) {
            //logger.info('postItemSuccess ' + response );
            setTimeout(function(){
                rest.getItem("VoiceMessage",getItemSuccess,requestError,alexa)
            },100)
        }
        function requestError(response,alexa) {
            logger.info('requestError ' + response );

            alexa.response.speak("request error");
            alexa.emit(':responseReady');
        }
        
        rest.postItemCommand("VoiceCommand",phrase+"|"+client_id,postItemSuccess,requestError,this)
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
    }
};
