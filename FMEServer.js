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
 * @return {FMEServer} fme - FME Server connection object
 */
var FMEServer = ( function() {

    /**
     * @constructor FME Server connection object
     * @param {Object} config - The object holding the configuration
     *      { server : server_url,
     *        token : token_string,
     *        format : json_xml_or_http,
     *        detail : high_or_low,
     *        port : port_number_string,
     *        ssl : true_or_false
     *      }
     * -------------------- OR: LEGACY PARAMETERS BELOW --------------------
     * @param {String} server - Server URL
     * @param {String} token - Obtained from http://yourfmeserver/fmetoken
     * @param {String} format - Output format desired, json (default), xml, or html
     * @param {String} detail - high (default) or low
     * @param {Number} port - Port, default is 80 - string
     * @param {Boolean} ssl - Connect to the server via HTTPS
     */
    var fme = function(server, token, format, detail, port, ssl) {

        /**
         * Check for the server url and the token parameters - required for connection
         * @return null - if not valid
         */
        if (server == undefined || (typeof server == 'object' && server.server == undefined)) {
            console.log( 'FMEServer.js Error.  You did not specify a server URL in your configuration paramaters.' );
            return null;
        } else if (token == undefined && (typeof server == 'object' && server.token == undefined)) {
            console.log( 'FMEServer.js Error.  You did not specify a token in your configuration paramaters.' );
            return null;
        }

        /**
         * Configuration object, holds instance configuration
         */
        var config = { version : 'v2' };

        /**
         * Check for String paramaters vs. object, and build the configuration
         */
        if (typeof server == 'object') {
            config.server = server.server;
            config.token = server.token;
            config.accept = server.format || 'json';
            config.detail =  server.detail || 'high';
            config.port = server.port || '80';
            config.ssl = server.ssl || false;
        } else {
            config.server = server;
            config.token = token;
            config.accept = format || 'json';
            config.detail =  detail || 'high';
            config.port = port || '80';
            config.ssl = ssl || false;
        }

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
         * Remove trailing slash from sever if present
         */
        if (this._config('server').charAt(this._config('server').length - 1) == '/') {
            config.server = this._config('server').substr(0, this._config('server').length - 1);
        }

        /**
         * Converts server host to URL
         */
        if (this._config('server').substring(0, 4) != 'http') {
            config.server = 'http://' + this._config('server');
        }

        /**
         * Changes http:// to https:// if SSL is required
         */
        if (this._config('ssl')) {
            config.server = this._config('server').replace('http://','https://');
        }

        /**
         * Attaches port to server URL if not a standard port
         */
        var stdPorts = ['80', '443'];
        if (stdPorts.indexOf(this._config('port')) === -1) {
            config.server = this._config('server') + ':' + this._config('port');
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
            atyp = atyp || this._config('accept');

            var req = new XMLHttpRequest();
            
            if (url.indexOf('?') != -1) {
                url += '&detail=' + this._config('detail') + '&token=' + this._config('token');
            } else {
                url += '?detail=' + this._config('detail') + '&token=' + this._config('token');
            }

            req.open(rtyp, url, true);

            if(atyp !== null) {
                req.setRequestHeader('Accept', atyp);
            }

            if(ctyp !== null && ctyp != 'attachment') {
                req.setRequestHeader('Content-type', ctyp);
            }

            if(ctyp == 'attachment') {
                req.setRequestHeader('Content-type', 'application/octet-stream');
                req.setRequestHeader('Content-Disposition', 'attachment; filename="'+params.name+'"');
                params = params.contents;
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
    };


    /**
     * Gets the current session from FME Server. You can use this to get the path to any
     * files added through the file upload service.
     * @param {String} repository - The repository on the FME Server
     * @param {String} workspace - The name of the workspace on FME Server, i.e. workspace.fmw
     * @param {Function} callback - Callback function accepting sessionID as a string
     */
    function getSession(repository, workspace, callback){
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/fmedataupload/' + repository + '/' + workspace);
        var params = 'opt_extractarchive=false&opt_pathlevel=3&opt_fullpath=true';

        this._ajax(url, function(json) {
            callback(json);
        }, 'POST', params, 'application/x-www-form-urlencoded');
    }


    /**
     * Returns a WebSocket connection to the specified server
     * @param {String} id - A name for the desired WebSocket stream id
     * @param {Function} callback - Callback function to run after connection is opened (optional)
     * @return {WebSocket} ws - A WebSocket connection
     */
    function getWebSocketConnection(id, callback) {
        callback = callback || null;
        var url;

        if (this._config('server').indexOf('https://') != -1) {
            url = this._config('server').replace('https://','');
        } else {
            url = this._config('server').replace('http://','');
        }
        
        var ws = new WebSocket('ws://' + url + ':7078/websocket');
        ws.onopen = function() {
            var openMsg = {
                ws_op : 'open',
                ws_stream_id : id
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
     * @param {String} repository - The repository on the FME Server
     * @param {String} workspace - The name of the workspace on FME Server, i.e. workspace.fmw
     * @param {String} params - Any workspace-specific parameter values
     * @param {Function} callback - Callback function accepting the json return value
     */
    function runDataDownload(repository, workspace, params, callback){
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/fmedatadownload/' + repository + '/' + workspace);
        params = 'opt_responseformat=' + this._config('accept') + '&opt_showresult=true&' + params;

        this._ajax(url, function(json){
            callback(json);
        }, 'POST', params, 'application/x-www-form-urlencoded');
    }


    /**
     * Upload file(s) using data upload legacy service
     * @param {String} repository - The repository on the FME Server
     * @param {String} workspace - The name of the workspace on FME Server, i.e. workspace.fmw
     * @param {Object} files - The form file object
     * @param {String} jsid - The current session id
     * @param {Function} callback - Callback function accepting the json return value
     */
    function dataUpload(repository, workspace, files, jsid, callback) {
        callback = callback || this._returnObj;
        jsid = jsid || null;
        var url = this._URL('{{svr}}/fmedataupload/' + repository + '/' + workspace);
        if(jsid !== null) {
            url += ';jsessionid=' + jsid;
        }

        if(!FormData) { // IE9 and Older Browsers that don't support FormData
            
            // Random number for form and frame id
            var random = parseInt(Math.random() * 100000000);
            
            // Create the invisible iframe for the form target
            var iframe = document.createElement('iframe');
            iframe.id = random + '-frame';
            iframe.name = random;
            iframe.style.display = 'none';
            document.body.appendChild(iframe);

            // Create the form with the proper settings and set the target to the iframe
            var form = document.createElement('form');
            form.action = url;
            form.method = 'POST';
            form.enctype = 'multipart/form-data';

            // Clone the file input and set it's files
            var input = files.cloneNode(true);
            input.name = "files[]";
            input.files = files.files;
            form.appendChild(input);

            // Finish styling and submit the form
            form.target = random;
            form.id = random + '-form';
            form.style.display = 'none';
            document.body.appendChild(form);
            form.submit();

            // Send feedback for client methods
            callback({ submit : true, id : random });

        } else { // New HTML5 Method for browsers that support FormData
            
            // Chrome 7+, Firefox 4.0 (2.0), IE 10+, Opera 12+, Safari 5+
            var params = new FormData();
            
            // Loop through, support for multiple files
            for(var i = 0; i < files.files.length; i++) {
                params.append('files[]', files.files[i]);
            }

            this._ajax(url, function(json){
                callback(json);
            }, 'POST', params);
        }
    }


    /**
     * Get data upload files for the session
     * @param {String} repository - The repository on the FME Server
     * @param {String} workspace - The name of the workspace on FME Server, i.e. workspace.fmw
     * @param {String} jsid - The current session id
     * @param {Function} callback - Callback function accepting the json return value
     */
    function getDataUploads(repository, workspace, jsid, callback) {
        callback = callback || this._returnObj;
        jsid = jsid || null;
        var url = this._URL('{{svr}}/fmedataupload/' + repository + '/' + workspace + ';jsessionid=' + jsid);
        
        this._ajax(url, function(json){
            callback(json);
        });
    }
    

    /**
     * Runs a workspace with user uploaded session data
     * @param {String} path - The server path for the session
     * @param {String} params - The server path for the session
     * @param {Function} callback - Callback function accepting the json return value
     */
    function runWorkspaceWithData(path, params, callback) {
        callback = callback || this._returnObj;
        path = path || null;
        var url = this._URL('{{svr}}/fmedatadownload/' + repository + '/' + workspace + '?');
        var files = params.files;
        var extra = params.params;
        params = params.filename + '=%22%22';

        for(var f in files){
            params += path + '/' + files[f].name + '%22%20%22';
        }

        params += '&' + extra + '&opt_responseformat=json';
        
        this._ajax(url+params, function(json){
            callback(json);
        });
    }


    /**
     * Retrieves all available repositories on the FME Server
     * @param {Function} callback - Callback function accepting the json return value
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
     * @param {String} repository - The repository on the FME Server
     * @param {String} type - The specific type of file item requested (optional)
     * @param {Function} callback - Callback function accepting the json return value
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
     * @param {String} repository - The repository on the FME Server
     * @param {String} workspace - The name of the workspace on FME Server, i.e. workspace.fmw
     * @param {Function} callback - Callback function accepting the json return value
     */
    function getWorkspaceParameters(repository, workspace, callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/fmerest/{{ver}}/repositories/' + repository + '/items/' + workspace + '/parameters');
        
        this._ajax(url, function(json){
            callback(json);
        });
    }


    /**
     * Generates a standard workspace parameters form
     * @param {String} id - The container id to place the form elements
     * @param {Object} json - The json object representing the form parameters
     */
    function generateFormItems(id, json) {
        var form = document.getElementById(id);
        // Loop through the JSON object and build the form
        for(var i = 0; i < json.length; i++) {
            var param = json[i];
            var label = document.createElement("label");
            label.innerHTML = param.description;
            form.appendChild(label);
            var choice;
            if(param.type === "FILE_OR_URL") {
                choice = document.createElement("input");
                choice.type = "file";
                choice.name = param.name;
            } else if(param.type === "LISTBOX") {
                choice = document.createElement("div");
                var options = param.listOptions;
                for(var a = 0; a < options.length; a++) {
                    var option = options[a];
                    var checkbox = document.createElement("input");
                    checkbox.type = "checkbox";
                    checkbox.value = option.value;
                    checkbox.name = param.name;
                    choice.appendChild(checkbox);
                    var caption = document.createElement("label");
                    caption.innerHTML = option.caption;
                    choice.appendChild(caption);
                }
            } else if(param.type === "LOOKUP_CHOICE" ||
                      param.type === "STRING_OR_CHOICE" ||
                      param.type === "CHOICE")
            {
                choice = document.createElement("select");
                choice.name = param.name;
                var options = param.listOptions;
                for(var a = 0; a < options.length; a++) {
                    var option = options[a];
                    var optionItem = document.createElement("option");
                    optionItem.innerHTML = option.caption;
                    optionItem.value = option.value;
                    choice.appendChild(optionItem);
                }
            } else if(param.type  === "TEXT_EDIT") {
                choice = document.createElement("textarea");
                choice.name = param.name;
            } else if(param.type  == "INTEGER") {
                choice = document.createElement("input");
                choice.type = "number";
                choice.name = param.name;
            } else if(param.type  == "PASSWORD") {
                choice = document.createElement("input");
                choice.type = "password";
                choice.name = param.name;
            } else {
                choice = document.createElement("input");
                choice.value = param.defaultValue;
                choice.name = param.name;
            }

            form.appendChild(choice);
            var br = document.createElement("br");
            form.appendChild(br);
        }
    }


    /**
     * Retrieves all scheduled items
     * @param {Function} callback - Callback function accepting the json return value
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
     * @param {String} category - Schedule category title
     * @param {String} name - Schedule name
     * @param {Function} callback - Callback function accepting the json return value
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
     * @param {String} category - Schedule category title
     * @param {String} name - Schedule name
     * @param {Function} callback - Callback function accepting the json return value
     */
    function enableScheduleItem(category, item, callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/fmerest/{{ver}}/schedules/' + category + '/' + item + '/enabled');
        var params = 'value=true';

        this._ajax(url, function(json){
            callback(json);
        }, 'PUT', params, 'application/x-www-form-urlencoded');
    }


    /**
     * Disables a scheduled item
     * @param {String} category - Schedule category title
     * @param {String} item - Schedule name
     * @param {Function} callback - Callback function accepting the json return value
     */
    function disableScheduleItem(category, item, callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/fmerest/{{ver}}/schedules/' + category + '/' + item + '/enabled');
        var params = 'value=false';
        
        this._ajax(url, function(json){
            callback(json);
        }, 'PUT', params, 'application/x-www-form-urlencoded');
    }


    /**
     * Replaces a scheduled item
     * @param {String} category - Schedule category title
     * @param {String} item - Schedule name
     * @param {Object} schedule - Object holding the schedule information
     * @param {Function} callback - Callback function accepting the json return value
     */
    function replaceScheduleItem(category, item, schedule, callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/fmerest/{{ver}}/schedules/' + category + '/' + item);
        var params = JSON.stringify(schedule);
        
        this._ajax(url, function(json){
            callback(json);
        }, 'PUT', params, 'application/json');
    }

    /**
     * Remove a scheduled item
     * @param {String} category - Schedule category title
     * @param {String} item - Schedule name
     * @param {Function} callback - Callback function accepting the json return value
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
     * @param {Object} schedule - Object holding the schedule information
     * @param {Function} callback - Callback function accepting the json return value
     */
    function createScheduleItem(schedule, callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/fmerest/{{ver}}/schedules');
        var params = JSON.stringify(schedule);

        this._ajax(url, function(json){
            callback(json);
        }, 'POST', params, 'application/json');
    }


    /**
     * Get all publications
     * @param {Function} callback - Callback function accepting the json return value
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
     * @param {String} name - Publication name
     * @param {Function} callback - Callback function accepting the json return value
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
     * @param {Object} publication - Object holding the publication information
     * @param {Function} callback - Callback function accepting the json return value
     */
    function createPublication(publication, callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/fmerest/{{ver}}/notifications/publications');
        var params = JSON.stringify(publication);
        
        this._ajax(url, function(json){
            callback(json);
        }, 'POST', params, 'application/json');
    }


    /**
     * Update a publication
     * @param {String} name - Publication name
     * @param {Object} publication - Object holding the publication information
     * @param {Function} callback - Callback function accepting the json return value
     */
    function updatePublication(name, publication, callback) {
        callback = callback || this._returnObj;
        name = encodeURIComponent(name).replace(/%20/g, '+');
        var url = this._URL('{{svr}}/fmerest/{{ver}}/notifications/publications/' + name);
        var params = JSON.stringify(publication);
        
        this._ajax(url, function(json){
            callback(json);
        }, 'PUT', params, 'application/json');
    }


    /**
     * Delete a publication
     * @param {String} name - Publication name
     * @param {Function} callback - Callback function accepting the json return value
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
     * Get Publisher Protocols
     * @param {Function} callback - Callback function accepting the json return value
     */
    function getPublisherProtocols(callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/fmerest/{{ver}}/notifications/publishers/');
        
        this._ajax(url, function(json){
            callback(json);
        });
    }


    /**
     * Query Publisher Protocol
     * @param {String} name - Protocol name
     * @param {Function} callback - Callback function accepting the json return value
     */
    function queryPublisherProtocol(name, callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/fmerest/{{ver}}/notifications/publishers/' + name);
        
        this._ajax(url, function(json){
            callback(json);
        });
    }


    /**
     * Get all subscriptions
     * @param {Function} callback - Callback function accepting the json return value
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
     * @param {String} name - Subscription name
     * @param {Function} callback - Callback function accepting the json return value
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
     * @param {Object} subscription - Object holding the subscription information
     * @param {Function} callback - Callback function accepting the json return value
     */
    function createSubscription(subscription, callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/fmerest/{{ver}}/notifications/subscriptions');
        var params = JSON.stringify(subscription);
        
        this._ajax(url, function(json){
            callback(json);
        }, 'POST', params, 'application/json');
    }


    /**
     * Update a subscription
     * @param {String} name - subscription name
     * @param {Object} subscription - Object holding the subscription information
     * @param {Function} callback - Callback function accepting the json return value
     */
    function updateSubscription(name, subscription, callback) {
        callback = callback || this._returnObj;
        name = encodeURIComponent(name).replace(/%20/g, '+');
        var url = this._URL('{{svr}}/fmerest/{{ver}}/notifications/subscription/' + name);
        var params = JSON.stringify(subscription);
        
        this._ajax(url, function(json){
            callback(json);
        }, 'PUT', params, 'application/json');
    }


    /**
     * Delete a subscription
     * @param {String} name - subscription name
     * @param {Function} callback - Callback function accepting the json return value
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
     * Get Subscriber Protocols
     * @param {Function} callback - Callback function accepting the json return value
     */
    function getSubscriberProtocols(callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/fmerest/{{ver}}/notifications/subscribers/');
        
        this._ajax(url, function(json){
            callback(json);
        });
    }


    /**
     * Query Subscriber Protocol
     * @param {String} name - Protocol name
     * @param {Function} callback - Callback function accepting the json return value
     */
    function querySubscriberProtocol(name, callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/fmerest/{{ver}}/notifications/subscribers/' + name);
        
        this._ajax(url, function(json){
            callback(json);
        });
    }


    /**
     * Get Notification Topics
     * @param {Function} callback - Callback function accepting the json return value
     */
    function getNotificationTopics(callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/fmerest/{{ver}}/notifications/topics');
        
        this._ajax(url, function(json){
            callback(json);
        });
    }


    /**
     * Get Notification Topic
     * @param {String} name - Topic name
     * @param {Function} callback - Callback function accepting the json return value
     */
    function getNotificationTopic(name, callback) {
        callback = callback || this._returnObj;
        name = encodeURIComponent(name);
        var url = this._URL('{{svr}}/fmerest/{{ver}}/notifications/topics' + name);
        
        this._ajax(url, function(json){
            callback(json);
        });
    }


    /**
     * Create Topic
     * @param {String} name - Topic name
     * @param {String} description - Topic description
     * @param {Function} callback - Callback function accepting the json return value
     */
    function createTopic(name, description, callback) {
        callback = callback || this._returnObj;
        name = encodeURIComponent(name).replace(/%20/g, '+');
        description = encodeURIComponent(description).replace(/%20/g, '+');
        var url = this._URL('{{svr}}/fmerest/{{ver}}/notifications/topics');
        var params = "name=" + name + "&description=" + description;

        this._ajax(url, function(json){
            callback(json);
        }, 'POST', params, 'application/x-www-form-urlencoded');
    }


    /**
     * Update Topic Description
     * @param {String} name - Topic name
     * @param {String} description - Topic description
     * @param {Function} callback - Callback function accepting the json return value
     */
    function updateTopic(name, description, callback) {
        callback = callback || this._returnObj;
        name = encodeURIComponent(name);
        description = encodeURIComponent(description).replace(/%20/g, '+');
        var url = this._URL('{{svr}}/fmerest/{{ver}}/notifications/topics' + name);
        var params = "description=" + description;

        this._ajax(url, function(json){
            callback(json);
        }, 'PUT', params, 'application/x-www-form-urlencoded');
    }


    /**
     * Delete Topic
     * @param {String} name topic name
     * @param {Function} callback - Callback function accepting the json return value
     */
    function deleteTopic(name, callback) {
        callback = callback || this._returnObj;
        name = encodeURIComponent(name);
        var url = this._URL('{{svr}}/fmerest/{{ver}}/notifications/topics' + name);

        this._ajax(url, function(json){
            callback(json);
        }, 'DELETE', null, 'application/x-www-form-urlencoded');
    }


    /**
     * Publish JSON or XML to a topic
     * @param {String} name - Topic name
     * @param {String} params - The data as a json string or xml string
     * @param {String} type - The type of data (JSON or XML)
     * @param {Function} callback - Callback function accepting the json return value
     */
    function publishToTopicStructured(name, params, type, callback) {
        callback = callback || this._returnObj;
        name = encodeURIComponent(name);
        type = type.toLowerCase() || 'json';
        var url = this._URL('{{svr}}/fmerest/{{ver}}/notifications/topics/' + name + '/message/map');
        if (type == 'xml') {
            type = 'application/xml';
        } else {
            type = 'application/json';
            try {
                params = JSON.parse(params);
                params = JSON.stringify(params);
            } catch(e) {
                var message = { message : 'Unable to parse JSON' };
                callback(message);
                return false;
            }
        }

        this._ajax(url, function(json){
            callback(json);
        }, 'POST', params, type);
    }


    /**
     * Publish anything to a topic
     * @param {String} name - Topic name
     * @param {Object} or {String} params - The raw text data
     * @param {Function} callback - Callback function accepting the json return value
     */
    function publishToTopic(name, params, callback) {
        callback = callback || this._returnObj;
        name = encodeURIComponent(name);
        var url = this._URL('{{svr}}/fmerest/{{ver}}/notifications/topics/' + name + '/message/raw');

        this._ajax(url, function(json){
            callback(json);
        }, 'POST', params, '*/*');
    }


    /**
     * Lookup user token
     * @param {Function} callback - Callback function accepting the json return value
     */
    function lookupToken(user, password, callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/fmetoken/service/view.json');
        var params = 'user=' + user + '&password=' + password;
        
        this._ajax(url, function(json){
            callback(json);
        }, 'POST', params, 'application/x-www-form-urlencoded');
    }


    /**
     * Generate guest token
     * @param {Function} callback - Callback function accepting the json return value
     */
    function generateToken(user, password, count, unit, callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/fmetoken/service/generate');
        var params = 'user=' + user + '&password=' + password + '&expiration=' + count + '&timeunit=' + unit;
        
        this._ajax(url, function(json){
            callback(json);
        }, 'POST', params, 'application/x-www-form-urlencoded');
    }


    /**
     * Submit a Job to Run asynchronously
     * @param {String} repository - The repository on the FME Server
     * @param {String} workspace - The name of the workspace on FME Server, i.e. workspace.fmw
     * @param {String} params - Any workspace-specific parameter values
     * @param {Function} callback - Callback function accepting the json return value
     */
    function submitJob(repository, workspace, params, callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/fmerest/{{ver}}/transformations/commands/submit/' + repository + '/' + workspace);
        params = JSON.stringify(params);

        this._ajax(url, function(json){
            callback(json);
        }, 'POST', params, 'application/json');
    }


    /**
     * Submit a Job to Run Synchronously
     * @param {String} repository - The repository on the FME Server
     * @param {String} workspace - The name of the workspace on FME Server, i.e. workspace.fmw
     * @param {String} params - Any workspace-specific parameter values
     * @param {Function} callback - Callback function accepting the json return value
     */
    function submitSyncJob(repository, workspace, params, callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/fmerest/{{ver}}/transformations/commands/transact/' + repository + '/' + workspace);
        params = JSON.stringify(params);

        this._ajax(url, function(json){
            callback(json);
        }, 'POST', params, 'application/json');
    }


    /**
     * Get a List of All Shared Resources
     * @param {Function} callback - Callback function accepting the json return value
     */
    function getResources(callback) {
        callback = callback || this._returnObj;
        var url = this._URL('{{svr}}/fmerest/{{ver}}/resources');

        this._ajax(url, function(json){
            callback(json);
        });
    }


    /**
     * Get Resource Details
     * @param {String} resource - The resource name
     * @param {String} path - The file path within the resource on the server
     * @param {Function} callback - Callback function accepting the json return value
     */
    function getResourceDetails(resource, path, callback) {
        callback = callback || this._returnObj;
        path = encodeURIComponent(path).replace(/%2F/g, '/');
        var url = this._URL('{{svr}}/fmerest/{{ver}}/resources/' + resource + '/filesys' + path);

        this._ajax(url, function(json){
            callback(json);
        });
    }


    /**
     * Delete Resource
     * @param {String} resource - The resource name
     * @param {String} path - The file path within the resource on the server
     * @param {Function} callback - Callback function accepting the json return value
     */
    function deleteResource(resource, path, callback) {
        callback = callback || this._returnObj;
        path = encodeURIComponent(path).replace(/%2F/g, '/');
        var url = this._URL('{{svr}}/fmerest/{{ver}}/resources/' + resource + '/filesys' + path);

        this._ajax(url, function(json){
            callback(json);
        }, 'DELETE');
    }


    /**
     * Download Resource File
     * @param {String} resource - The resource name
     * @param {String} path - The resource file path on the server
     */
    function downloadResourceFile(resource, path) {
        path = encodeURIComponent(path).replace(/%2F/g, '/');
        var url = this._URL('{{svr}}/fmerest/{{ver}}/resources/' + resource + '/filesys' + path + '?accept=contents');
        
        var iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        iframe.src = url + '&token=' + this._config('token');
    }


    /**
     * Upload Resource File
     * @param {String} resource - The resource name
     * @param {String} path - The file path within the resource on the server
     * @param {Object} params - The custom file input object { name : name, contents : contents }
     * @param {Function} callback - Callback function accepting the json return value
     * @param {Boolean} overwrite - Overwrite files, true or false(default)
     * @param {String} folders - Create folders from path, true or false(default)
     */
    function uploadResourceFile(resource, path, params, callback, overwrite, folders) {
        callback = callback || this._returnObj;
        overwrite = overwrite || false;
        folders = folders || false;
        path = encodeURIComponent(path).replace(/%2F/g, '/');
        var url = this._URL('{{svr}}/fmerest/{{ver}}/resources/' + resource + '/filesys' + path);
        url = url + '?createDirectories=' + folders + '&overwrite=' + overwrite + '&type=FILE';

        this._ajax(url, function(json){
            callback(json);
        }, 'POST', params, 'attachment');
    }


    /**
     * Submit a custom REST request directly to the API
     * @param {String} url - Full url of the REST call including the server
     * @param {String} type - The request type, i.e. GET, POST, PUSH, ...
     * @param {Function} callback - Callback function accepting the json return value
     * @param {String} params - Any parameter values required by the API (Optional)
     * @param {String} ctyp - The Content type of the data being sent, ex: 'application/json'
     */
    function customRequest(url, type, callback, params, ctyp) {
        callback = callback || this._returnObj;
        params = params || null;
        type = type.toUpperCase();
        ctyp = ctyp || null;

        this._ajax(url, function(json){
            callback(json);
        }, type, params, ctyp);
    }


    /**
     * Attach all public methods to the FMEServer Connection Object
     */
    function _init() {
        fme.prototype.getSession = getSession
        fme.prototype.getWebSocketConnection = getWebSocketConnection;
        fme.prototype.runDataDownload = runDataDownload;
        fme.prototype.dataUpload = dataUpload;
        fme.prototype.getDataUploads = getDataUploads;
        fme.prototype.runWorkspaceWithData = runWorkspaceWithData;
        fme.prototype.getRepositories = getRepositories;
        fme.prototype.getRepositoryItems = getRepositoryItems;
        fme.prototype.getWorkspaceParameters = getWorkspaceParameters;
        fme.prototype.generateFormItems = generateFormItems;
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
        fme.prototype.getPublisherProtocols = getPublisherProtocols;
        fme.prototype.queryPublisherProtocol = queryPublisherProtocol;
        fme.prototype.getAllSubscriptions = getAllSubscriptions;
        fme.prototype.getSubscription = getSubscription;
        fme.prototype.createSubscription = createSubscription;
        fme.prototype.updateSubscription = updateSubscription;
        fme.prototype.deleteSubscription = deleteSubscription;
        fme.prototype.getSubscriberProtocols = getSubscriberProtocols;
        fme.prototype.querySubscriberProtocol = querySubscriberProtocol;
        fme.prototype.getNotificationTopics = getNotificationTopics;
        fme.prototype.getNotificationTopic = getNotificationTopic;
        fme.prototype.publishToTopicStructured = publishToTopicStructured;
        fme.prototype.publishToTopic = publishToTopic;
        fme.prototype.createTopic = createTopic;
        fme.prototype.updateTopic = updateTopic;
        fme.prototype.deleteTopic = deleteTopic;
        fme.prototype.lookupToken = lookupToken;
        fme.prototype.generateToken = generateToken;
        fme.prototype.submitJob = submitJob;
        fme.prototype.submitSyncJob = submitSyncJob;
        fme.prototype.getResources = getResources;
        fme.prototype.getResourceDetails = getResourceDetails;
        fme.prototype.deleteResource = deleteResource;
        fme.prototype.downloadResourceFile = downloadResourceFile;
        fme.prototype.uploadResourceFile = uploadResourceFile;
        fme.prototype.customRequest = customRequest;
    }

    /**
     * Return the constructed FMEServer Connection Object
     */ 
    return fme;

}());
