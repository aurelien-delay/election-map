(function()
{
    'use strict';

    angular.module('app', [ 'app.utils', 'app.readjson', 'app.readelections', 'app.fullscreen', 'ngRoute' ])
        // --- routing ---
        .config(['$routeProvider', function ($routeProvider) 
        {
            $routeProvider.otherwise({redirectTo: '/fullscreen'});
        }])
})();