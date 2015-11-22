(function () {
    'use strict';

    angular.module("app.readjson", [])
        .factory("ReadJSON", function ($http) {
            var JSONService = {};

            JSONService.promises = {};

            /**
             * If input path has already been read, return the stored promise, 
             * else make an http request, store the promise and return it.
             * @param {String} path
             * @returns {JSONService.promises}
             */
            JSONService.getData = function (path)
            {
                console.info("get Data for path ", path, " - in promises: ", JSONService.promises);
                if ( ! (path in JSONService.promises) )    
                {
                    JSONService.promises[path] = read(path);
                }
                return JSONService.promises[path];
            };

            /**
             * Send the http request to read the JSON file with input path.
             * Use callback to return only the data from the reply.
             * @param {String} path
             * @returns {Promise}
             */
            function read(path)
            {
                console.info("read JSON: ", path);
                var promise = $http.get(path);
                return promise.then(getResponse);
                
                /**
                 * Callback called when http replies.
                 * Return data from the response + the path used.
                 * @param {Object} response
                 * @returns {Object}
                 */
                function getResponse(response)
                {
                    console.info("http response: ", response);
                    response.data.path = path;
                    return response.data;
                }
            };
            return JSONService;
        });
})();