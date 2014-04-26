/*****************************************************************************
 * FMEServer.js
 * 2013 Safe Software
 * support@safe.com
 *
 * Unofficial JavaScript API for FME Server >= 2014. This is not intended to
 * be a complete API like the C++, C# and Java APIs, but rather a collection
 * of boilerplate methods for REST API calls typically needed in a web page
 * interfacing with FME Server.
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
 * FME Server connection object
 * @author Safe Software
 * @version 3.0
 * @this FMEServer
 * @return {FMEServer} FME Server connection object
 */
var FMEServer = ( function() {

    /**
     * @constructor FME Server connection object
     * @param {String} svr Server URL
     * @param {String} token Obtained from http://yourfmeserver/fmetoken
     * @param {String} format Output format desired, json (default), xml, or html
     * @param {String} detail - high (default) or low
     * @param {Number} port Port, default is 80 - string
     * @param {Boolean} ssl Connect to the server via HTTPS
     */
    var fme = function(svr, token, format, detail, port, ssl) {

        if (svr.indexOf('http://') === -1) {
            svr = 'http://' + svr;
        }

        if (ssl) {
            svr = svr.replace('http://','https://');
        }

        var config = {
            server : svr,
            token : token,
            accept : format || 'json',
            detail :  detail || 'high',
            port : port || '80',
            ssl : ssl || false,
            version : 'v2'
        };

        /**
         * Get Settings Method
         * @param {String} name of setting
         * @return {String} individual parameter, or {Object} settings
         */
        this._config = function(param) {
            param = param || null;
            if (param) {
                return config[param];
            }
            return config;
        };

        /**
         * Return Object Method.
         * @param {Object} object to return
         * @return {Object} the object
         */
        this._returnObj = function(obj) {
            return obj;
        };

        /**
         * AJAX Method
         * @param {String} url The request URL
         * @param {Function} callback Callback function accepting json response
         * @param {String} rtyp Type of request ex: PUT, GET(Default)
         * @param {String} Param -> Value pair string of items or json
         */
        this._ajax = function(url, callback, rtyp, params) {
            rtyp = rtyp || 'GET';
            params = params || null;
            var req = new XMLHttpRequest();
            
            if (url.indexOf('?') != -1) {
                url += '&detail=' + this._config('detail') + '&token=' + this._config('token');
            } else {
                url += '?detail=' + this._config('detail') + '&token=' + this._config('token');
            }

            req.open(rtyp, url, true);
            req.setRequestHeader('Accept', this._config('accept'));

            if ((rtyp == 'PUT' || rtyp == 'POST') && params.indexOf('{')) {
                req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            }
            if (params !== null && params.indexOf('{') != -1) {
                req.setRequestHeader('Content-type', 'application/json');
            }

            req.onreadystatechange = function() {
                var done = 4;
                
                if (req.readyState == done) {
                    var resp = req.responseText;
                    if (resp.indexOf('{') != -1) {
                        resp = JSON.parse(resp);
                    } else if (resp.length === 0 && req.status == 204) {
                        resp = { 'delete' : true };
                    }
                    callback(resp);
                }
            };
            req.send(params);
        };
		
		this._URL = function(url) {
			url = url.replace(/{{svr}}/g, this._config('server'));
			url = url.replace(/{{ver}}/g, this._config('version'));
			return url;
		};

        _init();
    };


    /**
     * Gets the current session id from FME Server. You can use this to get the path to any
     * files added through the file upload service.
     * @param {String} repository The repository on the FME Server
     * @param {String} workspace The name of the workspace on FME Server, i.e. workspace.fmw
     * @param {Function} callback Callback function accepting sessionID as a string
     */
    function getSessionID(repository, workspace, callback){
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/fmedataupload/' + repository + '/' + workspace);
        var params = 'opt_extractarchive=false&opt_pathlevel=3&opt_fullpath=true';

        this._ajax(url, function(json) {
            callback(json.serviceResponse.session);
        }, params);
    }


    /**
     * Returns a WebSocket connection to the specified server
     * @param {String} stream_id A name for the desired WebSocket stream id
     * @return {WebSocket} A WebSocket connection
     * @param {Function} callback Callback function to run after connection is opened (optional)
     */
    function getWebSocketConnection(stream_id, callback) {
        callback = callback || null;
        var url;

        if (this._config('server').indexOf('https://') != -1) {
            url = url.replace('https://','');
        } else {
            url = this._config('server').replace('http://','');
        }
        
        var ws = new WebSocket('ws://' + url + ':7078/websocket');
        ws.onopen = function() {
            var openMsg = {
                ws_op : 'open',
                ws_stream_id : stream_id
            };
            ws.send(JSON.stringify(openMsg));
            if (callback !== null){
                callback();
            }
        };
        return ws;
    }


    /**
     * Runs a workspace using the Data Download service and returns json
     * @param {String} repository The repository on the FME Server
     * @param {String} workspace The name of the workspace on FME Server, i.e. workspace.fmw
     * @param {String} params Any workspace-specific parameter values
     * @param {Function} callback Callback function accepting the json return value
     */
    function runDataDownload(repository, workspace, params, callback){
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/fmedatadownload/' + repository + '/' + workspace);
        params = 'opt_responseformat=' + this._config('accept') + '&opt_showresult=true&' + params;

        this._ajax(url, function(json){
            callback(json);
        }, 'POST', params);
    }


    /**
     * Retrieves all available repositories on the FME Server
     * @param {Function} callback Callback function accepting the json return value
     */
    function getRepositories(callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/fmerest/{{ver}}/repositories');
        
        this._ajax(url, function(json){
            callback(json);
        });
    }


    /**
     * Retrieves all items on the FME Server for a given Repository
     * @param {String} repository The repository on the FME Server
     * @param {String} type (optional) the specific type of file item requested
     * @param {Function} callback Callback function accepting the json return value
     */
    function getRepositoryItems(repository, type, callback) {
        type = type || '';
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/fmerest/{{ver}}/repositories/' + repository + '/items?type=' + type);
        
        this._ajax(url, function(json){
            callback(json);
        });
    }


    /**
     * Retrieves all published params for a given workspace
     * @param {String} repository The repository on the FME Server
     * @param {String} workspace The name of the workspace on FME Server, i.e. workspace.fmw
     * @param {Function} callback Callback function accepting the json return value
     */
    function getWorkspaceParameters(repository, workspace, callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/fmerest/{{ver}}/repositories/' + repository + '/items/' + workspace + '/parameters');
        
        this._ajax(url, function(json){
            callback(json);
        });
    }


    /**
     * Retrieves all scheduled items
     * @param {Function} callback Callback function accepting the json return value
     */
    function getSchedules(callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/fmerest/{{ver}}/schedules');

        this._ajax(url, function(json){
            callback(json);
        });
    }


    /**
     * Returns a scheduled item
     * @param {String} category Schedule category title
     * @param {String} name Schedule name
     * @param {Function} callback Callback function accepting the json return value
     */
    function getScheduleItem(category, item, callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/fmerest/{{ver}}/schedules/' + category + '/' + item);

        this._ajax(url, function(json){
            callback(json);
        });
    }


    /**
     * Enables a scheduled item
     * @param {String} category Schedule category title
     * @param {String} name Schedule name
     * @param {Function} callback Callback function accepting the json return value
     */
    function enableScheduleItem(category, item, callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/fmerest/{{ver}}/schedules/' + category + '/' + item + '/enabled');
        var params = 'value=true';

        this._ajax(url, function(json){
            callback(json);
        }, 'PUT', params);
    }


    /**
     * Disables a scheduled item
     * @param {String} category Schedule category title
     * @param {String} item Schedule name
     * @param {Function} callback Callback function accepting the json return value
     */
    function disableScheduleItem(category, item, callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/fmerest/{{ver}}/schedules/' + category + '/' + item + '/enabled');
        var params = 'value=false';
        
        this._ajax(url, function(json){
            callback(json);
        }, 'PUT', params);
    }


    /**
     * Replaces a scheduled item
     * @param {String} category Schedule category title
     * @param {String} item Schedule name
     * @param {Object} schedule Object holding the schedule information
     * @param {Function} callback Callback function accepting the json return value
     */
    function replaceScheduleItem(category, item, schedule, callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/fmerest/{{ver}}/schedules/' + category + '/' + item);
        var params = JSON.stringify(schedule);
        
        this._ajax(url, function(json){
            callback(json);
        }, 'PUT', params);
    }

    /**
     * Remove a scheduled item
     * @param {String} category Schedule category title
     * @param {String} item Schedule name
     * @param {Function} callback Callback function accepting the json return value
     */
    function removeScheduleItem(category, item, callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/fmerest/{{ver}}/schedules/' + category + '/' + item);
        
        this._ajax(url, function(json){
            callback(json);
        }, 'DELETE');
    }


    /**
     * Create a scheduled item
     * @param {Object} schedule Object holding the schedule information
     * @param {Function} callback Callback function accepting the json return value
     */
    function createScheduleItem(schedule, callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/fmerest/{{ver}}/schedules');
        var params = JSON.stringify(schedule);

        this._ajax(url, function(json){
            callback(json);
        }, 'POST', params);
    }


    /**
     * Get all publications
     * @param {Function} callback Callback function accepting the json return value
     */
    function getAllPublications(callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/fmerest/{{ver}}/notifications/publications');
        
        this._ajax(url, function(json){
            callback(json);
        });
    }


    /**
     * Get a publication
     * @param {String} publication name
     * @param {Function} callback Callback function accepting the json return value
     */
    function getPublication(name, callback) {
        callback = callback || this._returnObj;
        name = encodeURIComponent(name).replace(/%20/g, '+');
        var url = this._URL('{{svr}}/fmerest/{{ver}}/notifications/publications/' + name);
        
        this._ajax(url, function(json){
            callback(json);
        });
    }


    /**
     * Create a publication
     * @param {Object} publication Object holding the publication information
     * @param {Function} callback Callback function accepting the json return value
     */
    function createPublication(publication, callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/fmerest/{{ver}}/notifications/publications');
        var params = publication;
        
        this._ajax(url, function(json){
            callback(json);
        }, 'POST', params);
    }


    /**
     * Update a publication
     * @param {String} publication name
     * @param {Object} publication Object holding the publication information
     * @param {Function} callback Callback function accepting the json return value
     */
    function updatePublication(name, publication, callback) {
        callback = callback || this._returnObj;
        name = encodeURIComponent(name).replace(/%20/g, '+');
        var url = this._URL('{{svr}}/fmerest/{{ver}}/notifications/publications/' + name);
        var params = publication;
        
        this._ajax(url, function(json){
            callback(json);
        }, 'PUT', params);
    }


    /**
     * Delete a publication
     * @param {String} publication name
     * @param {Function} callback Callback function accepting the json return value
     */
    function deletePublication(name, callback) {
        callback = callback || this._returnObj;
        name = encodeURIComponent(name).replace(/%20/g, '+');
        var url = this._URL('{{svr}}/fmerest/{{ver}}/notifications/publications/' + name);
        
        this._ajax(url, function(json){
            callback(json);
        }, 'DELETE');
    }


    /**
     * Get all subscriptions
     * @param {Function} callback Callback function accepting the json return value
     */
    function getAllSubscriptions(callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/fmerest/{{ver}}/notifications/subscriptions');
        
        this._ajax(url, function(json){
            callback(json);
        });
    }


    /**
     * Get a subscription
     * @param {String} subscription name
     * @param {Function} callback Callback function accepting the json return value
     */
    function getSubscription(name, callback) {
        callback = callback || this._returnObj;
        name = encodeURIComponent(name).replace(/%20/g, '+');
        var url = this._URL('{{svr}}/fmerest/{{ver}}/notifications/subscription/' + name);
        
        this._ajax(url, function(json){
            callback(json);
        });
    }


    /**
     * Create a subscription
     * @param {Object} subscription Object holding the subscription information
     * @param {Function} callback Callback function accepting the json return value
     */
    function createSubscription(subscription, callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/fmerest/{{ver}}/notifications/subscriptions');
        var params = subscription;
        
        this._ajax(url, function(json){
            callback(json);
        }, 'POST', publication);
    }


    /**
     * Update a subscription
     * @param {String} subscription name
     * @param {Object} subscription Object holding the publication information
     * @param {Function} callback Callback function accepting the json return value
     */
    function updateSubscription(name, subscription, callback) {
        callback = callback || this._returnObj;
        name = encodeURIComponent(name).replace(/%20/g, '+');
        var url = this._URL('{{svr}}/fmerest/{{ver}}/notifications/subscription/' + name);
        var params = subscription;
        
        this._ajax(url, function(json){
            callback(json);
        }, 'PUT', params);
    }


    /**
     * Delete a subscription
     * @param {String} subscription name
     * @param {Function} callback Callback function accepting the json return value
     */
    function deleteSubscription(name, callback) {
        callback = callback || this._returnObj;
        name = encodeURIComponent(name).replace(/%20/g, '+');
        var url = this._URL('{{svr}}/fmerest/{{ver}}/notifications/subscriptions/' + name);
        
        this._ajax(url, function(json){
            callback(json);
        }, 'DELETE');
    }


    /**
     * Get Notification Topics
     * @param {Function} callback Callback function accepting the json return value
     */
    function getNotificationTopics(callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/fmerest/{{ver}}/notifications/topics');
        
        this._ajax(url, function(json){
            callback(json);
        });
    }


    /**
     * Get Notification Protocols
     * @param {Function} callback Callback function accepting the json return value
     */
    function getNotificationProtocols(callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/fmerest/{{ver}}/notifications/');
        
        this._ajax(url, function(json){
            callback(json);
        });
    }


    /**
     * Query Notification Protocol
	 * @param {String} protocol name
     * @param {Function} callback Callback function accepting the json return value
     */
    function queryNotificationProtocol(name, callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/fmerest/{{ver}}/notifications/' + name);
        
        this._ajax(url, function(json){
            callback(json);
        });
    }


    /**
     * Lookup user token
     * @param {Function} callback Callback function accepting the json return value
     */
    function lookupToken(user, password, callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/fmetoken/service/view.json');
        var params = 'user=' + user + '&password=' + password;
        
        this._ajax(url, function(json){
            callback(json);
        }, 'POST', params);
    }


    /**
     * Generate guest token
     * @param {Function} callback Callback function accepting the json return value
     */
    function generateToken(user, password, count, unit, callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/fmetoken/service/generate');
        var params = 'user=' + user + '&password=' + password + '&expiration=' + count + '&timeunit=' + unit;
        
        this._ajax(url, function(json){
            callback(json);
        }, 'POST', params);
    }


    /**
     * Submit a Job to Run asynchronously
     * @param {String} repository The repository on the FME Server
     * @param {String} workspace The name of the workspace on FME Server, i.e. workspace.fmw
     * @param {String} params Any workspace-specific parameter values
     * @param {Function} callback Callback function accepting the json return value
     */
    function submitJob(repository, workspace, params, callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/fmerest/{{ver}}/transformations/commands/submit/' + repository + '/' + workspace);

        this._ajax(url, function(json){
            callback(json);
        }, 'POST', JSON.stringify(params));
    }


    /**
     * Submit a Job to Run Synchronously
     * @param {String} repository The repository on the FME Server
     * @param {String} workspace The name of the workspace on FME Server, i.e. workspace.fmw
     * @param {String} params Any workspace-specific parameter values
     * @param {Function} callback Callback function accepting the json return value
     */
    function submitSyncJob(repository, workspace, params, callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/fmerest/{{ver}}/transformations/commands/transact/' + repository + '/' + workspace);
        
        this._ajax(url, function(json){
            callback(json);
        }, 'POST', JSON.stringify(params));
    }


    /**
     * Submit a custom REST request directly to the API
     * @param {String} url Full url of the REST call including the server
     * @param {String} type The request type, i.e. GET, POST, PUSH, ...
     * @param {Function} callback Callback function accepting the json return value
     * @param {String} params Any parameter values required by the API (Optional)
     */
    function customRequest(url, type, callback, params) {
        callback = callback || this._returnObj;
        params = params || null;
        type = type.toUpperCase();

        this._ajax(url, function(json){
            callback(json);
        }, type, params);
    }


    /**
     * Attach all public methods to the FMEServer Connection Object
     */
    function _init() {
        fme.prototype.getSessionID = getSessionID;
        fme.prototype.getWebSocketConnection = getWebSocketConnection;
        fme.prototype.runDataDownload = runDataDownload;
        fme.prototype.getRepositories = getRepositories;
        fme.prototype.getRepositoryItems = getRepositoryItems;
        fme.prototype.getWorkspaceParameters = getWorkspaceParameters;
        fme.prototype.getSchedules = getSchedules;
        fme.prototype.getScheduleItem = getScheduleItem;
        fme.prototype.enableScheduleItem = enableScheduleItem;
        fme.prototype.disableScheduleItem = disableScheduleItem;
        fme.prototype.replaceScheduleItem = replaceScheduleItem;
        fme.prototype.removeScheduleItem = removeScheduleItem;
        fme.prototype.createScheduleItem = createScheduleItem;
        fme.prototype.getAllPublications = getAllPublications;
        fme.prototype.getPublication = getPublication;
        fme.prototype.createPublication = createPublication;
        fme.prototype.updatePublication = updatePublication;
        fme.prototype.deletePublication = deletePublication;
        fme.prototype.getAllSubscriptions = getAllSubscriptions;
        fme.prototype.getSubscription = getSubscription;
        fme.prototype.createSubscription = createSubscription;
        fme.prototype.updateSubscription = updateSubscription;
        fme.prototype.deleteSubscription = deleteSubscription;
        fme.prototype.getNotificationTopics = getNotificationTopics;
        fme.prototype.getNotificationProtocols = getNotificationProtocols;
        fme.prototype.queryNotificationProtocol = queryNotificationProtocol;
        fme.prototype.lookupToken = lookupToken;
        fme.prototype.generateToken = generateToken;
        fme.prototype.submitJob = submitJob;
        fme.prototype.submitSyncJob = submitSyncJob;
        fme.prototype.customRequest = customRequest;
    }

    /**
     * Return the constructed FMEServer Connection Object
     */ 
    return fme;

}());
