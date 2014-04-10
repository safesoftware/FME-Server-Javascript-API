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
 * Create instance of FME Server connection object
 * @this FMEServer
 * @constructor
 * @author Safe Software
 * @version 3.0
 * @param {String} svrHost Host name only, not URL
 * @param {String} token Obtained from http://yourfmeserver/fmetoken
 * @param {Number} svrPort Port, default is 80 - string
 * @param {Boolean} isSSL Connect to the server via HTTPS?
 * @return {FMEServer} FME Server connection object
 */
function FMEServer(svrHost, token, svrPort, isSSL) {

    this.svrHost = svrHost;
    this.svrPort = svrPort || '80';
    this.token = token;
    this.isSSL = isSSL || false;
    this.defaults = '&accept=json&detail=high';
    this.dataDownloadDefaults = "&opt_responseformat=json&opt_showresult=true";

}


/**
 * Gets the current session id from FME Server. You can use this to get the path to any files added through
 * the file upload service.
 * @param {String} repository The repository on the FME Server
 * @param {String} wrkspName The name of the workspace on FME Server, i.e. workspace.fmw
 * @param {Function} callback Callback function accepting sessionID as a string
 */
FMEServer.prototype.getSessionID = getSessionID;
function getSessionID(repository, wrkspName, callback){
    var callback = callback || _returnObject;
    var url = 'http://'+this.svrHost + '/fmedataupload/' + repository + '/' + wrkspName + '?opt_extractarchive=false&opt_pathlevel=3&opt_fullpath=true';
    
    _ajax(url, function(json) {
        callback(json.serviceResponse.session);
    });
    
}


/**
 * Returns a WebSocket connection object to the specified server
 * @param {String} stream_id A name for the desired WebSocket stream id
 * @return {WebSocket} A WebSocket connection object
 */
FMEServer.prototype.getWebSocketConnection = getWebSocketConnection;
function getWebSocketConnection(stream_id) {
    var wsConn = new WebSocket('ws://' + svrHost + ':7078/websocket');
    wsConn.onopen = function() {
        var openMsg = {
            ws_op : 'open',
            ws_stream_id : stream_id
        }
        wsConn.send(JSON.stringify(openMsg));
    };
    return wsConn;
}


/**
 * Runs a workspace using the Data Download service and returns the 
 * path to download the results in the Json results object
 * @param {String} repository The repository on the FME Server
 * @param {String} workspace The name of the workspace on FME Server, i.e. workspace.fmw
 * @param {String} parameters Any workspace-specific parameter values as a string of this form: name1=value1&name2=value2 etc...
 * @param {Function} callback Callback function accepting the json return value
 */
FMEServer.prototype.runDataDownload = runDataDownload;
function runDataDownload(repository, workspace, parameters, callback){
    var callback = callback || _returnObject;
    var url = this.svrHost + '/fmedatadownload/' + repository + '/' + workspace;

    _ajax(url, function(json){
        callback(json);
    }, 'POST', parameters+this.dataDownloadDefaults);
}


/**
 * Retrieves all available repositories on the FME Server
 * @param {Function} callback Callback function accepting the json return value
 */
FMEServer.prototype.getRepositories = getRepositories;
function getRepositories(callback) {
    var callback = callback || _returnObject;
    var url = this.svrHost + '/fmerest/v2/repositories?token=' + this.token + this.defaults;
    
    _ajax(url, function(json){
        callback(json);
    });
}


/**
 * Retrieves all items on the FME Server for a given Repository
 * @param {String} repository The repository on the FME Server
 * @param {String} type (optional) the specific type of file item requested
 * @param {Function} callback Callback function accepting the json return value
 */
FMEServer.prototype.getRepositoryItems = getRepositoryItems;
function getRepositoryItems(repository, type, callback) {
    type = type || '';
    var callback = callback || _returnObject;
    var url = this.svrHost + '/fmerest/v2/repositories/' + repository + '/items?token=' + this.token + '&type=' + type + this.defaults;
    
    _ajax(url, function(json){
        callback(json);
    });
}


/**
 * Retrieves all published parameters for a given workspace
 * @param {String} repository The repository on the FME Server
 * @param {String} workspace The name of the workspace on FME Server, i.e. workspace.fmw
 * @param {Function} callback Callback function accepting the json return value
 */
FMEServer.prototype.getWorkspaceParameters = getWorkspaceParameters;
function getWorkspaceParameters(repository, workspace, callback) {
    var callback = callback || _returnObject;
    var url = this.svrHost + '/fmerest/v2/repositories/' + repository + '/items/' + workspace + '/parameters?token=' + this.token + this.defaults;
    
    _ajax(url, function(json){
        callback(json);
    });
}


/**
 * Retrieves all scheduled items
 * @param {Function} callback Callback function accepting the json return value
 */
FMEServer.prototype.getSchedules = getSchedules;
function getSchedules(callback) {
    var callback = callback || _returnObject;
    var url = this.svrHost + '/fmerest/v2/schedules?token=' + this.token + this.defaults;

    _ajax(url, function(json){
        callback(json);
    });
}


/**
 * Returns a scheduled item
 * @param {String} category Schedule category title
 * @param {String} name Schedule name
 * @param {Function} callback Callback function accepting the json return value
 */
FMEServer.prototype.getScheduleItem = getScheduleItem;
function getScheduleItem(category, item, callback) {
    var callback = callback || _returnObject;
    var url = this.svrHost + '/fmerest/v2/schedules/' + category + '/' + item + '?token=' + this.token + this.defaults;

    _ajax(url, function(json){
        callback(json);
    });
}


/**
 * Enables a scheduled item
 * @param {String} category Schedule category title
 * @param {String} name Schedule name
 * @param {Function} callback Callback function accepting the json return value
 */
FMEServer.prototype.enableScheduleItem = enableScheduleItem;
function enableScheduleItem(category, item, callback) {
    var callback = callback || _returnObject;
    var url = this.svrHost + '/fmerest/v2/schedules/' + category + '/' + item + '/enabled?token=' + this.token + this.defaults;
    var parameters = 'value=true';

    _ajax(url, function(json){
        callback(json);
    }, 'PUT', parameters);
}


/**
 * Disables a scheduled item
 * @param {String} category Schedule category title
 * @param {String} item Schedule name
 * @param {Function} callback Callback function accepting the json return value
 */
FMEServer.prototype.disableScheduleItem = disableScheduleItem;
function disableScheduleItem(category, item, callback) {
    var callback = callback || _returnObject;
    var url = this.svrHost + '/fmerest/v2/schedules/' + category + '/' + item + '/enabled?token=' + this.token + this.defaults;
    var parameters = 'value=false';
    
    _ajax(url, function(json){
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
FMEServer.prototype.replaceScheduleItem = replaceScheduleItem;
function replaceScheduleItem(category, item, schedule, callback) {
    var callback = callback || _returnObject;
    var url = this.svrHost + '/fmerest/v2/schedules/' + category + '/' + item + '?token=' + this.token + this.defaults;
    var parameters = JSON.stringify(schedule);
    
    _ajax(url, function(json){
        callback(json);
    }, 'PUT', parameters);
}

/**
 * Remove a scheduled item
 * @param {String} category Schedule category title
 * @param {String} item Schedule name
 * @param {Function} callback Callback function accepting the json return value
 */
FMEServer.prototype.removeScheduleItem = removeScheduleItem;
function removeScheduleItem(category, item, callback) {
    var callback = callback || _returnObject;
    var url = this.svrHost + '/fmerest/v2/schedules/' + category + '/' + item + '?token=' + this.token + this.defaults;
    
    _ajax(url, function(json){
        callback(json);
    }, 'DELETE');
}


/**
 * Create a scheduled item
 * @param {Object} schedule Object holding the schedule information
 * @param {Function} callback Callback function accepting the json return value
 */
FMEServer.prototype.createScheduleItem = createScheduleItem;
function createScheduleItem(schedule, callback) {
    var callback = callback || _returnObject;
    var url = this.svrHost + '/fmerest/v2/schedules?token=' + this.token + this.defaults;
    var parameters = JSON.stringify(schedule);

    _ajax(url, function(json){
        callback(json);
    }, 'POST', parameters);
}


/**
 * Create a publication
 * @param {Object} publication Object holding the publication information
 * @param {Function} callback Callback function accepting the json return value
 */
FMEServer.prototype.createPublication = createPublication;
function createPublication(publication, callback) {
    var callback = callback || _returnObject;
    var url = this.svrHost + '/fmerest/v2/notifications/publications?token=' + this.token + this.defaults;
    var parameters = publication;
    
    _ajax(url, function(json){
        callback(json);
    }, 'POST', publication);
}


/**
 * Create a subscription
 * @param {Object} subscription Object holding the subscription information
 * @param {Function} callback Callback function accepting the json return value
 */
FMEServer.prototype.createSubscription = createSubscription;
function createSubscription(subscription, callback) {
    var callback = callback || _returnObject;
    var url = this.svrHost + '/fmerest/v2/notifications/publications?token=' + this.token + this.defaults;
    var parameters = subscription;
    
    _ajax(url, function(json){
        callback(json);
    }, 'POST', publication);
}


/**
 * Lookup user token
 * @param {Function} callback Callback function accepting the json return value
 */
FMEServer.prototype.lookupToken = lookupToken;
function lookupToken(user, password, callback) {
    var callback = callback || _returnObject;
    var url = this.svrHost + '/fmetoken/service/view.json';
    var parameters = 'user='+user+'&password='+password;
    
    _ajax(url, function(json){
        callback(json);
    }, 'POST', parameters);
}


/**
 * Generate guest token
 * @param {Function} callback Callback function accepting the json return value
 */
FMEServer.prototype.generateToken = generateToken;
function generateToken(user, password, count, unit, callback) {
    var callback = callback || _returnObject;
    var url = this.svrHost + '/fmetoken/service/generate';
    var parameters = 'user='+user+'&password='+password+'&expiration='+count+'&timeunit='+unit;
    
    _ajax(url, function(json){
        callback(json);
    }, 'POST', parameters);
}


/**
 * Submit a Job to Run asynchronously
 * @param {String} repository The repository on the FME Server
 * @param {String} workspace The name of the workspace on FME Server, i.e. workspace.fmw
 * @param {String} parameters Any workspace-specific parameter values as a string of this form: name1=value1&name2=value2 etc...
 * @param {Function} callback Callback function accepting the json return value
 */
FMEServer.prototype.submitJob = submitJob;
function submitJob(repository, workspace, parameters, callback) {
    var callback = callback || _returnObject;
    var url = this.svrHost + '/fmerest/v2/transformations/commands/submit/' + repository + '/' + workspace + '?token=' + this.token + this.defaults;

    _ajax(url, function(json){
        callback(json);
    }, 'POST', JSON.stringify(parameters));
}


/**
 * Submit a Job to Run Synchronously
 * @param {String} repository The repository on the FME Server
 * @param {String} workspace The name of the workspace on FME Server, i.e. workspace.fmw
 * @param {String} parameters Any workspace-specific parameter values as a string of this form: name1=value1&name2=value2 etc...
 * @param {Function} callback Callback function accepting the json return value
 */
FMEServer.prototype.submitSyncJob = submitSyncJob;
function submitSyncJob(repository, workspace, parameters, callback) {
    var callback = callback || _returnObject;
    var url = this.svrHost + '/fmerest/v2/transformations/commands/transact/' + repository + '/' + workspace + '?token=' + this.token + this.defaults;
    
    _ajax(url, function(json){
        callback(json);
    }, 'POST', JSON.stringify(parameters));
}


/**
 * Return helper method.
 * @param {Object} object to return
 */
FMEServer.prototype._returnObject = _returnObject;
function _returnObject(obj) {
    return obj;
}


/**
 * Private AJAX helper method.
 * @param {String} url The request URL
 * @param {Function} whenDone Callback function accepting JSON response object
 * @param {String} rtyp Type of request ex: PUT, GET(Default)
 * @param {String} Param -> Value pair uri string of items
 */
FMEServer.prototype._ajax = _ajax;
function _ajax(url, whenDone, rtyp, params) {
    var req_type = rtyp || 'GET';
    var params = params || null;
    var http_request = new XMLHttpRequest();
    http_request.open(req_type, url, true);
    if ((req_type == 'PUT' || req_type == 'POST') && params.indexOf('{')) {
        http_request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    }
    if (params != null && params.indexOf('{') != -1) {
        http_request.setRequestHeader('Content-type', 'application/json');
    }
    http_request.onreadystatechange = function() {
        var done = 4;
        var codes = [ 200, 201, 202, 203, 204, 404 ];
        
        if (http_request.readyState == done && (codes.indexOf(http_request.status) != -1)) {
            var response = http_request.responseText;
            if (response.indexOf('{') != -1) {
                response = JSON.parse(response);
            } else if( response.length == 0 && http_request.status == 204 ) {
                response = { 'delete' : true };
            }
            whenDone(response);
        }
    };
    http_request.send(params);
}