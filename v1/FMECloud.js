/*****************************************************************************
 * FMECloud.js
 * 2013 Safe Software
 * support@safe.com
 *
 * Unofficial JavaScript API for FME Cloud >= 2014. This is not intended to
 * be a complete API like the C++, C# and Java APIs, but rather a collection
 * of boilerplate methods for REST API calls typically needed in a web page
 * interfacing with FME Cloud.
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2013 Safe Software
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
 * FME Cloud connection object
 * @author Safe Software
 * @version 1.0
 * @this FMECloud
 * @return {FMECloud} fme - FME Cloud connection object
 */
var FMECloud = ( function() {

    /**
     * @constructor FME Cloud connection object
     * @param {String} token - Obtained from your FME Cloud account
     */
    var fme = function(token) {
        
        /**
         * Check for the token parameters - required for connection
         * @return null - if not valid
         */
        if (token == undefined) {
            var error = 'FMECloud.js Error.  You did not specify a token in your configuration paramaters.';
            if (window.console && console.log) {
                console.log( error );
            } else {
                alert( error );
            }
            return null;
        }

        /**
         * Add indexOf and trim method for Array's in older browsers
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
            server : 'https://api.fmecloud.com',
            token : token,
            xdomain : false
        };

        /**
         * Get Configuration Method
         * @param {String} name - Name of setting
         * @return {String} - individual parameter, or {Object} - config
         */
        this._config = function(param) {
            param = param || null;
            if (param) {
                return config[param];
            }
            return config;
        };

        /**
         * Set IE8 / IE9 CORS mode if required
         */
        if (location.host != this._config('server').split('//')[1].split('/')[0] &&
            navigator.appName == 'Microsoft Internet Explorer' &&
            (navigator.appVersion.indexOf('MSIE 9') !== -1 || navigator.appVersion.indexOf('MSIE 8') !== -1)
           )
        {
            config.xdomain = true;
        }

        /**
         * Return Object Method.
         * @param {Object} obj - Object to return
         * @return {Object} obj - The Object
         */
        this._returnObj = function(obj) {
            return obj;
        };

        /**
         * AJAX Method
         * @param {String} url - The request URL
         * @param {Function} callback - Callback function accepting json response
         * @param {String} rtyp - Type of request ex: PUT, GET(Default)
         * @param {String} params - The json or name=value pair string or parameters
         * @param {String} ctyp - Content type as a string (optional)
         * @param {String} atyp - Accept type as a string (optional)
         */
        this._ajax = function(url, callback, rtyp, params, ctyp, atyp) {
            rtyp = rtyp || 'GET';
            params = params || null;
            ctyp = ctyp || null;
            atyp = atyp || 'json';

            var req;

            if (this._config('xdomain')) {
                var error = {
                    error : 'FMECloud.js Error.  IE8 and IE9 do not support the custom headers required for Cloud CORS requests.  Browser Not Supported.',
                    url : url,
                    request_type : rtyp,
                    parameters : params,
                    serviceResponse : {
                        message : "CORS Error",
                        url : "/getting-started/cross-domain-requests"
                    }
                };
                callback(error);
            } else {
                var req = new XMLHttpRequest();

                req.open(rtyp, url, true);
                req.setRequestHeader('Accept', atyp);
                req.setRequestHeader('Authorization', 'Bearer ' + this._config('token'));

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
        };
        
        /**
         * Build URL from config Method.
         * @param {String} url - URL with placeholders
         * @return {String} url - The result url
         */
        this._URL = function(url) {
            url = url.replace(/{{svr}}/g, this._config('server'));
            url = url.replace(/{{ver}}/g, this._config('version'));
            return url;
        };

        _init();
    }        


    /**
     * Launch a New Instance
     * @param {String} params - The name=value pairs containing the instance information
     * @param {Function} callback - Callback function accepting the json return value
     */
    function launchInstance(params, callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/{{ver}}/instances');

        this._ajax(url, function(json){
            callback(json);
        }, 'POST', params, 'application/x-www-form-urlencoded');
    }


    /**
     * Pause a Server Instance
     * @param {String} id - The id of the instance
     * @param {Function} callback - Callback function accepting the json return value
     */
    function pauseInstance(id, callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/{{ver}}/instances/' + id + '/pause');

        this._ajax(url, function(json){
            callback(json);
        }, 'PUT');
    }


    /**
     * Start a Server Instance
     * @param {String} id - The id of the instance
     * @param {Function} callback - Callback function accepting the json return value
     */
    function startInstance(id, callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/{{ver}}/instances/' + id + '/start');

        this._ajax(url, function(json){
            callback(json);
        }, 'PUT');
    }


    /**
     * Restart a Server Instance
     * @param {String} id - The id of the instance
     * @param {Function} callback - Callback function accepting the json return value
     */
    function restartInstance(id, callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/{{ver}}/instances/' + id + '/restart');

        this._ajax(url, function(json){
            callback(json);
        }, 'PUT');
    }


    /**
     * Terminate a Server Instance
     * @param {String} id - The id of the instance
     * @param {Function} callback - Callback function accepting the json return value
     */
    function terminateInstance(id, callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/{{ver}}/instances/' + id + '/terminate');

        this._ajax(url, function(json){
            callback(json);
        }, 'PUT');
    }


    /**
     * Get Instances
     * @param {Function} callback - Callback function accepting the json return value
     */
    function getInstances(callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/{{ver}}/instances');

        this._ajax(url, function(json){
            callback(json);
        });
    }


    /**
     * Get Instance
     * @param {String} id - The id of the instance
     * @param {Function} callback - Callback function accepting the json return value
     */
    function getInstance(id, callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/{{ver}}/instances/' + id);

        this._ajax(url, function(json){
            callback(json);
        });
    }


    /**
     * Get Instance Credentials
     * @param {String} id - The id of the instance
     * @param {Function} callback - Callback function accepting the json return value
     */
    function getCredentials(id, callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/{{ver}}/instances/' + id + '/credentials');

        this._ajax(url, function(json){
            callback(json);
        });
    }


    /**
     * Check Account Balance
     * @param {Function} callback - Callback function accepting the json return value
     */
    function checkBalance(callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/{{ver}}/account/balance');

        this._ajax(url, function(json){
            callback(json);
        });
    }


    /**
     * Get Versions
     * @param {Function} callback - Callback function accepting the json return value
     */
    function getVersions(callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/{{ver}}/fme_server_version.json');

        this._ajax(url, function(json){
            callback(json);
        });
    }


    /**
     * Attach all public methods to the FMECloud Connection Object
     */
    function _init() {
        fme.prototype.launchInstance = launchInstance;
        fme.prototype.pauseInstance = pauseInstance;
        fme.prototype.startInstance = startInstance;
        fme.prototype.restartInstance = restartInstance;
        fme.prototype.terminateInstance = terminateInstance;
        fme.prototype.getInstances = getInstances;
        fme.prototype.getInstance = getInstance;
        fme.prototype.getCredentials = getCredentials;
        fme.prototype.checkBalance = checkBalance;
        fme.prototype.getVersions = getVersions;
    }

    /**
     * Return the constructed FMECloud Connection Object
     */ 
    return fme;

}());