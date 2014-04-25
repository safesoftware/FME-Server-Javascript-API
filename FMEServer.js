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
     * @param {String} svrHost Host name only, not URL
     * @param {String} token Obtained from http://yourfmeserver/fmetoken
     * @param {String} format Output format desired, json (default), xml, or html
     * @param {String} detail - high (default) or low
     * @param {Number} svrPort Port, default is 80 - string
     * @param {Boolean} isSSL Connect to the server via HTTPS
     */
    var fme = function(svrHost, token, format, detail, svrPort, isSSL) {

        if (svrHost.indexOf('http://') === -1) {
            svrHost = 'http://' + svrHost;
        }

        if (isSSL) {
            svrHost = svrHost.replace('http://','https://');
        }

        var settings = {
            server : svrHost,
            token : token,
            accept : format || 'json',
            detail :  detail || 'high',
            port : svrPort || '80',
            ssl : isSSL || false,
            version : 'v2'
        };

        /**
         * Get Settings Method
         * @param {String} name of setting
         * @return {String} individual parameter, or {Object} settings
         */
        this._getSettings = function(param) {
            var parameter = param || null;
            if (parameter) {
                return settings[parameter];
            }
            return settings;
        }

        /**
         * Return Object Method.
         * @param {Object} object to return
         * @return {Object} the object
         */
        this._returnObject = function(obj) {
            return obj;
        }

        /**
         * AJAX Method
         * @param {String} url The request URL
         * @param {Function} whenDone Callback function accepting JSON response thisect
         * @param {String} rtyp Type of request ex: PUT, GET(Default)
         * @param {String} Param -> Value pair string of items or JSON
         */
        this._ajax = function(url, whenDone, rtyp, params) {
            var req_type = rtyp || 'GET';
            var params = params || null;
            var http_request = new XMLHttpRequest();
            
            if (url.indexOf('?') != -1) {
                url += '&detail=' + this._getSettings('detail') + '&token=' + this._getSettings('token');
            } else {
                url += '?detail=' + this._getSettings('detail') + '&token=' + this._getSettings('token');
            }

            http_request.open(req_type, url, true);
            http_request.setRequestHeader('Accept', this._getSettings('accept'));

            if ((req_type == 'PUT' || req_type == 'POST') && params.indexOf('{')) {
                http_request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            }
            if (params !== null && params.indexOf('{') != -1) {
                http_request.setRequestHeader('Content-type', 'application/json');
            }

            http_request.onreadystatechange = function() {
                var done = 4;
                
                if (http_request.readyState == done) {
                    var response = http_request.responseText;
                    if (response.indexOf('{') != -1) {
                        response = JSON.parse(response);
                    } else if (response.length === 0 && http_request.status == 204) {
                        response = { 'delete' : true };
                    }
                    whenDone(response);
                }
            };
            http_request.send(params);
        }

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
        var callback = callback || this._returnObject;
        var url = this._getSettings('server') + '/fmedataupload/' + repository + '/' + workspace;
        var parameters = 'opt_extractarchive=false&opt_pathlevel=3&opt_fullpath=true';

        this._ajax(url, function(json) {
            callback(json.serviceResponse.session);
        }, parameters);
    }


    /**
     * Returns a WebSocket connection thisect to the specified server
     * @param {String} stream_id A name for the desired WebSocket stream id
     * @return {WebSocket} A WebSocket connection thisect
     * @param {Function} callback Callback function to run after connection is opened (optional)
     */
    function getWebSocketConnection(stream_id, callback) {
        var callback = callback || null;
        var url;

        if (this._getSettings('server').indexOf('https://') != -1) {
            url = url.replace('https://','');
        } else {
            url = this._getSettings('server').replace('http://','');
        }
        
        var wsConn = new WebSocket('ws://' + url + ':7078/websocket');
        wsConn.onopen = function() {
            var openMsg = {
                ws_op : 'open',
                ws_stream_id : stream_id
            };
            wsConn.send(JSON.stringify(openMsg));
            if (callback !== null){
                callback();
            };
        };
        return wsConn;
    }


    /**
     * Runs a workspace using the Data Download service and returns the 
     * path to download the results in the Json results thisect
     * @param {String} repository The repository on the FME Server
     * @param {String} workspace The name of the workspace on FME Server, i.e. workspace.fmw
     * @param {String} parameters Any workspace-specific parameter values
     * @param {Function} callback Callback function accepting the json return value
     */
    function runDataDownload(repository, workspace, parameters, callback){
        var callback = callback || this._returnObject;
        var url = this._getSettings('server') + '/fmedatadownload/' + repository + '/' + workspace;
        parameters = 'opt_responseformat=' + this._getSettings('accept') + '&opt_showresult=true&' + parameters;

        this._ajax(url, function(json){
            callback(json);
        }, 'POST', parameters);
    }


    /**
     * Retrieves all available repositories on the FME Server
     * @param {Function} callback Callback function accepting the json return value
     */
    function getRepositories(callback) {
        var callback = callback || this._returnObject;
        var url = this._getSettings('server') + '/fmerest/' + this._getSettings('version') + '/repositories';
        
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
        var callback = callback || this._returnObject;
        var url = this._getSettings('server') + '/fmerest/' + this._getSettings('version') + '/repositories/' + repository + '/items?type=' + type;
        
        this._ajax(url, function(json){
            callback(json);
        });
    }


    /**
     * Retrieves all published parameters for a given workspace
     * @param {String} repository The repository on the FME Server
     * @param {String} workspace The name of the workspace on FME Server, i.e. workspace.fmw
     * @param {Function} callback Callback function accepting the json return value
     */
    function getWorkspaceParameters(repository, workspace, callback) {
        var callback = callback || this._returnObject;
        var url = this._getSettings('server') + '/fmerest/' + this._getSettings('version') + '/repositories/' + repository + '/items/' + workspace + '/parameters';
        
        this._ajax(url, function(json){
            callback(json);
        });
    }


    /**
     * Retrieves all scheduled items
     * @param {Function} callback Callback function accepting the json return value
     */
    function getSchedules(callback) {
        var callback = callback || this._returnObject;
        var url = this._getSettings('server') + '/fmerest/' + this._getSettings('version') + '/schedules';

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
        var callback = callback || this._returnObject;
        var url = this._getSettings('server') + '/fmerest/' + this._getSettings('version') + '/schedules/' + category + '/' + item;

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
        var callback = callback || this._returnObject;
        var url = this._getSettings('server') + '/fmerest/' + this._getSettings('version') + '/schedules/' + category + '/' + item + '/enabled';
        var parameters = 'value=true';

        this._ajax(url, function(json){
            callback(json);
        }, 'PUT', parameters);
    }


    /**
     * Disables a scheduled item
     * @param {String} category Schedule category title
     * @param {String} item Schedule name
     * @param {Function} callback Callback function accepting the json return value
     */
    function disableScheduleItem(category, item, callback) {
        var callback = callback || this._returnObject;
        var url = this._getSettings('server') + '/fmerest/' + this._getSettings('version') + '/schedules/' + category + '/' + item + '/enabled';
        var parameters = 'value=false';
        
        this._ajax(url, function(json){
            callback(json);
        }, 'PUT', parameters);
    }


    /**
     * Replaces a scheduled item
     * @param {String} category Schedule category title
     * @param {String} item Schedule name
     * @param {Object} schedule Object holding the schedule information
     * @param {Function} callback Callback function accepting the json return value
     */
    function replaceScheduleItem(category, item, schedule, callback) {
        var callback = callback || this._returnObject;
        var url = this._getSettings('server') + '/fmerest/' + this._getSettings('version') + '/schedules/' + category + '/' + item;
        var parameters = JSON.stringify(schedule);
        
        this._ajax(url, function(json){
            callback(json);
        }, 'PUT', parameters);
    }

    /**
     * Remove a scheduled item
     * @param {String} category Schedule category title
     * @param {String} item Schedule name
     * @param {Function} callback Callback function accepting the json return value
     */
    function removeScheduleItem(category, item, callback) {
        var callback = callback || this._returnObject;
        var url = this._getSettings('server') + '/fmerest/' + this._getSettings('version') + '/schedules/' + category + '/' + item;
        
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
        var callback = callback || this._returnObject;
        var url = this._getSettings('server') + '/fmerest/' + this._getSettings('version') + '/schedules';
        var parameters = JSON.stringify(schedule);

        this._ajax(url, function(json){
            callback(json);
        }, 'POST', parameters);
    }


    /**
     * Get all publications
     * @param {Function} callback Callback function accepting the json return value
     */
    function getAllPublications(callback) {
        var callback = callback || this._returnObject;
        var url = this._getSettings('server') + '/fmerest/' + this._getSettings('version') + '/notifications/publications';
        
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
        var callback = callback || this._returnObject;
        var name = name.replace(/ /g, '%20');
        var url = this._getSettings('server') + '/fmerest/' + this._getSettings('version') + '/notifications/publications/' + name;
        
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
        var callback = callback || this._returnObject;
        var url = this._getSettings('server') + '/fmerest/' + this._getSettings('version') + '/notifications/publications';
        var parameters = publication;
        
        this._ajax(url, function(json){
            callback(json);
        }, 'POST', parameters);
    }


    /**
     * Update a publication
     * @param {String} publication name
     * @param {Object} publication Object holding the publication information
     * @param {Function} callback Callback function accepting the json return value
     */
    function updatePublication(name, publication, callback) {
        var callback = callback || this._returnObject;
        var name = name.replace(/ /g, '%20');
        var url = this._getSettings('server') + '/fmerest/' + this._getSettings('version') + '/notifications/publications/' + name;
        var parameters = publication;
        
        this._ajax(url, function(json){
            callback(json);
        }, 'PUT', parameters);
    }


    /**
     * Delete a publication
     * @param {String} publication name
     * @param {Function} callback Callback function accepting the json return value
     */
    function deletePublication(publication, callback) {
        var callback = callback || this._returnObject;
        var publication = publication.replace(/ /g, '%20');
        var url = this._getSettings('server') + '/fmerest/' + this._getSettings('version') + '/notifications/publications/' + publication;
        
        this._ajax(url, function(json){
            callback(json);
        }, 'DELETE');
    }


    /**
     * Get all subscriptions
     * @param {Function} callback Callback function accepting the json return value
     */
    function getAllSubscriptions(callback) {
        var callback = callback || this._returnObject;
        var url = this._getSettings('server') + '/fmerest/' + this._getSettings('version') + '/notifications/subscriptions';
        
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
        var callback = callback || this._returnObject;
        var name = name.replace(/ /g, '%20');
        var url = this._getSettings('server') + '/fmerest/' + this._getSettings('version') + '/notifications/subscription/' + name;
        
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
        var callback = callback || this._returnObject;
        var url = this._getSettings('server') + '/fmerest/' + this._getSettings('version') + '/notifications/subscriptions';
        var parameters = subscription;
        
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
        var callback = callback || this._returnObject;
        var name = name.replace(/ /g, '%20');
        var url = this._getSettings('server') + '/fmerest/' + this._getSettings('version') + '/notifications/subscription/' + name;
        var parameters = subscription;
        
        this._ajax(url, function(json){
            callback(json);
        }, 'PUT', parameters);
    }


    /**
     * Delete a subscription
     * @param {String} subscription name
     * @param {Function} callback Callback function accepting the json return value
     */
    function deleteSubscription(subscription, callback) {
        var callback = callback || this._returnObject;
        var subscription = subscription.replace(/ /g, '%20');
        var url = this._getSettings('server') + '/fmerest/' + this._getSettings('version') + '/notifications/subscriptions/' + subscription;
        
        this._ajax(url, function(json){
            callback(json);
        }, 'DELETE');
    }


    /**
     * Get Notification Topics
     * @param {Function} callback Callback function accepting the json return value
     */
    function getNotificationTopics(callback) {
        var callback = callback || this._returnObject;
        var url = this._getSettings('server') + '/fmerest/' + this._getSettings('version') + '/notifications/topics';
        
        this._ajax(url, function(json){
            callback(json);
        });
    }


    /**
     * Get Notification Protocols
     * @param {Function} callback Callback function accepting the json return value
     */
    function getNotificationProtocols(callback) {
        var callback = callback || this._returnObject;
        var url = this._getSettings('server') + '/fmerest/' + this._getSettings('version') + '/notifications/';
        
        this._ajax(url, function(json){
            callback(json);
        });
    }


    /**
     * Query Notification Protocol
     * @param {Function} callback Callback function accepting the json return value
     */
    function queryNotificationProtocol(protocol, callback) {
        var callback = callback || this._returnObject;
        var url = this._getSettings('server') + '/fmerest/' + this._getSettings('version') + '/notifications/' + protocol;
        
        this._ajax(url, function(json){
            callback(json);
        });
    }


    /**
     * Lookup user token
     * @param {Function} callback Callback function accepting the json return value
     */
    function lookupToken(user, password, callback) {
        var callback = callback || this._returnObject;
        var url = this._getSettings('server') + '/fmetoken/service/view.json';
        var parameters = 'user=' + user + '&password=' + password;
        
        this._ajax(url, function(json){
            callback(json);
        }, 'POST', parameters);
    }


    /**
     * Generate guest token
     * @param {Function} callback Callback function accepting the json return value
     */
    function generateToken(user, password, count, unit, callback) {
        var callback = callback || this._returnObject;
        var url = this._getSettings('server') + '/fmetoken/service/generate';
        var parameters = 'user=' + user + '&password=' + password + '&expiration=' + count + '&timeunit=' + unit;
        
        this._ajax(url, function(json){
            callback(json);
        }, 'POST', parameters);
    }


    /**
     * Submit a Job to Run asynchronously
     * @param {String} repository The repository on the FME Server
     * @param {String} workspace The name of the workspace on FME Server, i.e. workspace.fmw
     * @param {String} parameters Any workspace-specific parameter values
     * @param {Function} callback Callback function accepting the json return value
     */
    function submitJob(repository, workspace, parameters, callback) {
        var callback = callback || this._returnObject;
        var url = this._getSettings('server') + '/fmerest/' + this._getSettings('version') + '/transformations/commands/submit/' + repository + '/' + workspace;

        this._ajax(url, function(json){
            callback(json);
        }, 'POST', JSON.stringify(parameters));
    }


    /**
     * Submit a Job to Run Synchronously
     * @param {String} repository The repository on the FME Server
     * @param {String} workspace The name of the workspace on FME Server, i.e. workspace.fmw
     * @param {String} parameters Any workspace-specific parameter values
     * @param {Function} callback Callback function accepting the json return value
     */
    function submitSyncJob(repository, workspace, parameters, callback) {
        var callback = callback || this._returnObject;
        var url = this._getSettings('server') + '/fmerest/' + this._getSettings('version') + '/transformations/commands/transact/' + repository + '/' + workspace;
        
        this._ajax(url, function(json){
            callback(json);
        }, 'POST', JSON.stringify(parameters));
    }


    /**
     * Submit a custom REST request directly to the API
     * @param {String} url Full url of the REST call including the server
     * @param {String} type The request type, i.e. GET, POST, PUSH, ...
     * @param {Function} callback Callback function accepting the json return value
     * @param {String} parameters Any parameter values required by the API (Optional)
     */
    function customRequest(url, type, callback, parameters) {
        var callback = callback || this._returnObject;
        var parameters = parameters || null;
        var type = type.toUpperCase();

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
    };

    /**
     * Return the constructed FMEServer Connection Object
     */ 
    return fme;

}());