/*****************************************************************************
 * FMECloud.js
 * 2018 Safe Software
 * support@safe.com
 *
 * Unofficial JavaScript Library for FME Cloud >= 2014. This is not intended to
 * be a complete API like the C++, C# and Java APIs, but rather a collection
 * of boilerplate methods for REST API calls typically needed in a web page
 * interfacing with FME Cloud.
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2018 Safe Software
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 *****************************************************************************/

/**
 * FME Cloud Library
 * @author Safe Software
 * @version 1.2
 * @this FMECloud
 * @return {FMECloud} fme - FME Cloud connection object
 */
var FMECloud = ( function() {
    /**
     * Add indexOf and trim method for Strings and Array's in older browsers
     */
    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function(obj, start) {
            for (var i = (start || 0), j = this.length; i < j; i++) {
                if (this[i] === obj) { return i; }
            }
            return -1;
        }
    }

    if (typeof String.prototype.trim !== 'function') {
        String.prototype.trim = function() {
            return this.replace(/^\s+|\s+$/g, '');
        }
    }

    /**
     * Configuration object, holds instance configuration
     */
    var config = {
        version : 'v1',
        server : 'https://api.fmecloud.safe.com',
        xdomain : false
    };

    /**
     * Get Configuration Method
     * @param {String} name - Name of setting
     * @return {String} - individual parameter, or {Object} - config
     */
    function getConfig(param) {
        param = param || null;
        if (param) {
            return config[param];
        }
        return config;
    }

    /**
     * Check Config Status
     */
    function checkConfig() {
        if(getConfig().token){
            return true;
        }
        throw new Error('You must initialize FMECloud using the FMECloud.init() method.');
    }

    /**
     * AJAX Method
     * @param {String} url - The request URL
     * @param {Function} callback - Callback function accepting json response
     * @param {String} rtyp - Type of request ex: PUT, GET(Default)
     * @param {String} params - The json or name=value pair string or parameters
     * @param {String} ctyp - Content type as a string (optional)
     * @param {String} atyp - Accept type as a string (optional)
     */
    function ajax(url, callback, rtyp, params, ctyp, atyp) {
        rtyp = rtyp || 'GET';
        params = params || null;
        ctyp = ctyp || null;
        atyp = atyp || 'application/json';
        var req;

        if(callback === null || typeof callback != 'function') {
            throw new Error('A callback function must be defined in order to use the FME Cloud REST API.');
        }
        if (getConfig('xdomain')) {
            throw new Error('IE8 and IE9 do not support the custom headers required for Cloud CORS requests.  Browser Not Supported.');
        } else {
            var req = new XMLHttpRequest();

            req.open(rtyp, url, true);
            req.setRequestHeader('Accept', atyp);
            req.setRequestHeader('Authorization', 'Bearer ' + getConfig('token'));

            if(ctyp !== null) {
                req.setRequestHeader('Content-type', ctyp);
            }

            req.onreadystatechange = function() {
                var done = 4;

                if (req.readyState == done) {
                    var resp;
                    try {
                        resp = req.responseText;
                        if (resp.length === 0 && req.status == 204) {
                            resp = '{ "delete" : "true" }';
                        } else if (resp.length === 0 && req.status == 202) {
                            resp = '{ "value" : "true" }';
                        }
                        resp = JSON.parse(resp);
                    } catch (e) {
                        resp = req.response;
                    } finally {
                        callback(resp);
                    }
                }
            };
            req.send(params);
        }
    }

    /**
     * Build URL from config Method.
     * @param {String} url - URL with placeholders
     * @return {String} url - The result url
     */
    function buildURL(url) {
        url = url.replace(/{{svr}}/g, getConfig('server'));
        url = url.replace(/{{ver}}/g, getConfig('version'));
        return url;
    }

    /**
     * The FME Cloud Connection Object
     */
    var fme = {
        /**
         * Initialize the FME Cloud connection object
         * @param {String} token - Obtained from your FME Cloud account
         */
        init : function(token) {
            /**
             * Check for the token parameters - required for connection
             */
            if (token == undefined) {
                throw new Error('You did not specify a token in your configuration paramaters.');
            }
            getConfig().token = token;

            /**
             * Set IE8 / IE9 CORS mode if required
             */
            if (location.host != getConfig('server').split('//')[1].split('/')[0] &&
                navigator.appName == 'Microsoft Internet Explorer' &&
                (navigator.appVersion.indexOf('MSIE 9') !== -1 || navigator.appVersion.indexOf('MSIE 8') !== -1)
               )
            {
                getConfig().xdomain = true;
            }
        },

        /**
         * Launch a New Instance
         * @param {String} params - The name=value pairs containing the instance information
         * @param {Function} callback - Callback function accepting the json return value
         */
        launchInstance : function(params, callback) {
            callback = callback || null;
            var url = buildURL('{{svr}}/{{ver}}/instances');
            ajax(url, callback, 'POST', params, 'application/x-www-form-urlencoded');
        },

        /**
         * Pause a Server Instance
         * @param {String} id - The id of the instance
         * @param {Function} callback - Callback function accepting the json return value
         */
        pauseInstance : function(id, callback) {
            callback = callback || null;
            var url = buildURL('{{svr}}/{{ver}}/instances/' + id + '/pause');
            ajax(url, callback, 'PUT');
        },

        /**
         * Start a Server Instance
         * @param {String} id - The id of the instance
         * @param {Function} callback - Callback function accepting the json return value
         */
        startInstance : function(id, callback) {
            callback = callback || null;
            var url = buildURL('{{svr}}/{{ver}}/instances/' + id + '/start');
            ajax(url, callback, 'PUT');
        },

        /**
         * Restart a Server Instance
         * @param {String} id - The id of the instance
         * @param {Function} callback - Callback function accepting the json return value
         */
        restartInstance : function(id, callback) {
            callback = callback || null;
            var url = buildURL('{{svr}}/{{ver}}/instances/' + id + '/restart');
            ajax(url, callback, 'PUT');
        },

        /**
         * Terminate a Server Instance
         * @param {String} id - The id of the instance
         * @param {Function} callback - Callback function accepting the json return value
         */
        terminateInstance : function(id, callback) {
            callback = callback || null;
            var url = buildURL('{{svr}}/{{ver}}/instances/' + id + '/terminate');
            ajax(url, callback, 'PUT');
        },

        /**
         * Get Instances
         * @param {Function} callback - Callback function accepting the json return value
         */
        getInstances : function(callback) {
            callback = callback || null;
            var url = buildURL('{{svr}}/{{ver}}/instances');
            ajax(url, callback);
        },

        /**
         * Get Instance
         * @param {String} id - The id of the instance
         * @param {Function} callback - Callback function accepting the json return value
         */
        getInstance : function(id, callback) {
            callback = callback || null;
            var url = buildURL('{{svr}}/{{ver}}/instances/' + id);
            ajax(url, callback);
        },

        /**
         * Get Instance Credentials
         * @param {String} id - The id of the instance
         * @param {Function} callback - Callback function accepting the json return value
         */
        getCredentials : function(id, callback) {
            callback = callback || null;
            var url = buildURL('{{svr}}/{{ver}}/instances/' + id + '/credentials');
            ajax(url, callback);
        },

        /**
         * Check Account Balance
         * @param {Function} callback - Callback function accepting the json return value
         */
        checkBalance : function(callback) {
            callback = callback || null;
            var url = buildURL('{{svr}}/{{ver}}/account/balance');
            ajax(url, callback);
        },

        /**
         * Get Versions
         * @param {Function} callback - Callback function accepting the json return value
         */
        getVersions : function(callback) {
            callback = callback || null;
            var url = buildURL('{{svr}}/{{ver}}/fme_server_version.json');
            ajax(url, callback);
        }

    };

    /**
     * Return the FMECloud Connection Object
     */
    return fme;
}());
