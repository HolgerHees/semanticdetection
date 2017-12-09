"use strict";

let https = require('https');
let logger = require('./logger');

class Rest
{
    constructor(config)
    {
        this.config = config;
    }

    getItems(success, failure, payload)
    {
        return this.getItem(null, success, failure, payload);
    }

    getItem(itemName, success, failure, payload)
    {
        let options = this.buildRequestOptions(itemName, "GET");

        https.get(options, function (response)
        {
            let body = '';

            response.on('data', function (data)
            {
                body += data.toString();
            });

            response.on('end', function ()
            {
                if (response.statusCode !== 200)
                {
                    failure({message: 'Error response ' + response.statusCode});
                    logger.info('getItem failed for url: ' + options.path + ' code: ' + response.statusCode + ' data: ' + data);
                    return;
                }
                let resp = JSON.parse(body);
                success(resp, payload);
            });

            response.on('error', function (e)
            {
                failure(e, payload);
            });
        }).end();
    }

    postItemCommand(itemName, value, success, failure, payload)
    {
        let options = this.buildRequestOptions(itemName, 'POST', value.length);

        let req = https.request(options, function (response)
        {

            if (response.statusCode === 200 || response.statusCode === 201)
            {
                success(response, payload);
            }
            else
            {
                failure({message: 'Error response ' + response.statusCode});
            }
            response.on('error', function (e)
            {
                failure(e, payload);
            });
        });

        req.write(value);
        req.end();
    }

    buildRequestOptions(itemname, method, length)
    {
        let options = {
            hostname: this.config.host,
            port: this.config.port,
            path: this.config.path + (itemname || ''),
            method: method,
            headers: {}
        };

        if (this.config.userpass)
        {
            options.auth = this.config.userpass;
        }

        if (method === 'POST' || method === 'PUT')
        {
            options.headers['Content-Type'] = 'text/plain';
            options.headers['Content-Length'] = length;
        }
        return options;
    }
}

let PublicRest = (function ()
{
    let rest = null;

    function PublicRest(config)
    {
        rest = new Rest(config);
    }

    PublicRest.prototype.getItems = function (success, failure, payload)
    {
        return rest.getItems(success, failure, payload);
    };

    PublicRest.prototype.getItem = function (itemName, success, failure, payload)
    {
        return rest.getItem(itemName, success, failure, payload);
    };

    PublicRest.prototype.postItemCommand = function (itemName, value, success, failure, payload)
    {
        return rest.postItemCommand(itemName, value, success, failure, payload);
    };

    return PublicRest;
}());

module.exports = PublicRest;
