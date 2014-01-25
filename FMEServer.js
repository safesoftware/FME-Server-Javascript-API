/** FME Server connection object, with support for WebSockets
* @this FMEServer
* @constructor
* @version 2.0
* @param svrHost Host name only, not URL
* @param token Obtained from http://yourfmeserver/fmetoken
* @param svrPort Port, default is 80 - string
* @param isSSL Connect to the server via HTTPS?
* @return FME Server connection object
*/

function FMEServer(svrHost, token, svrPort, isSSL) {

        this.svrHost = svrHost;
        this.svrPort = svrPort || '80';
        this.token = token;
        this.isSSL = isSSL || false;

        this.getParams = getParams;
        function getParams(repository, wrkspName){
                var url = this.svrHost + ':' + this.svrPort + '/fmerest/repositories/' + repository + '/' + wrkspName + '/parameters.json?token=' + this.token;
                var params = null;

                $.ajax({
                        url: url,
                        async: false,
                        dataType: 'json',
                        success: function(json){
                                params = json;
                        }
                })
                return params;
        }

        //gets the current session id from FME Server
        //can use this to get the path to any files added through
        //the file upload service        
        this.getSessionID = getSessionID;
        function getSessionID(wrkspPath){
                //returns null if there is an error
                var url = this.svrHost + '/fmedataupload/' + wrkspPath + '?opt_extractarchive=false&opt_pathlevel=3&opt_fullpath=true';
                var sessionID = null;
                
                $.ajax({
                        url: url,
                        async: false,
                        dataType: 'json',
                        success: function(json){
                                sessionID = json.serviceResponse.session;
                        }
                });

                return sessionID;
        }
        
        /** Returns a WebSocket connection object to the specified server
         *
         *
         */
        this.getWebSocketConnection = getWebSocketConnection;
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

        /** Retrieves all repositories on the FME Server
         *
         *
         */
        this.getRepositories = getRepositories;
        function getRepositories() {
                var url = this.svrHost + '/repositories.json?token=' + this.token;
                var repositories = null;

                $.ajax({
                        url: url,
                        async: false,
                        dataType: 'json',
                        success: function(json){
                                repositories = json.serviceResponse.repositories.repository;
                        }
                });

                return repositories;
        }

        /** Retrieves all items on the FME Server for a given Repository
         *
         *
         */
        this.getRepositoryItems = getRepositoryItems;
        function getRepositoryItems(repository,type) {
                type = type || null;
                var url = this.svrHost + '/repositories/' + repository + '.json?token=' + this.token + '&type=' + type;
                var items = null;

                $.ajax({
                        url: url,
                        async: false,
                        dataType: 'json',
                        success: function(json){
                                items = json.serviceResponse.repository.workspaces.workspace;
                        }
                });

                return items;
        }


        /** Retrieves all published parameters for a given workspace
         *
         *
         */
        this.getWorkspaceParameters = getWorkspaceParameters;
        function getWorkspaceParameters(repository,workspace) {
                var url = this.svrHost + '/repositories/' + repository + '/' + workspace + '/parameters.json?token=' + this.token;
                var parameters = null;

                $.ajax({
                        url: url,
                        async: false,
                        dataType: 'json',
                        success: function(json){
                                parameters = json.serviceResponse.parameters.parameter;
                        }
                });

                return parameters;
        }

}
