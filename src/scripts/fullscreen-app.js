'use strict';

angular.module('app.fullscreen', ['ngRoute'])
    // --- routing ---
    .config(['$routeProvider', function($routeProvider) {
      $routeProvider.when('/fullscreen', {
        templateUrl: 'fullscreen.html',
      });
    }])