(function()
{
    'use strict';
    angular.module('app')
        .directive('map', ['Utils', directiveMap]);
        

    function directiveMap( Utils )
    {
        // console.log("directive map called");
        return {
            restrict : 'E',
            controller: 'ElectionsCtrl',
            link : linkMap
        };
        
        // internal function implemented here in order to access Utils
        function linkMap(scope, element) 
        {
            var options = 
            {
                zoom: scope.ctrl.settings.zoom,
                center: scope.ctrl.settings.center
            };
            console.info("loading google map with options: ", options);

            scope.ctrl.map = new google.maps.Map(element[0], options);

            // --- load the perimeters ---
            scope.ctrl.map.data.loadGeoJson(scope.ctrl.settings.map);

            // --- set area default style ---
            scope.ctrl.map.data.setStyle({fillColor: 'black', fillOpacity: scope.ctrl.settings.opacity, strokeOpacity: scope.ctrl.settings.opacity});

            // --- set map with default election ---
            Utils.changeElection( scope.ctrl.settings, scope.ctrl.focusElection, scope.ctrl.map, scope.ctrl.focusLabel, scope.ctrl.max, /*init=*/true );
            
            // --- set hover event listening ---
            var listener = scope.ctrl.map.addListener('idle', afterMapLoaded);

            function afterMapLoaded(event) {
                scope.ctrl.map.data.addListener('mouseover', scope.ctrl.openTooltip);
                scope.ctrl.map.data.addListener('mouseout', scope.ctrl.closeTooltip);
                scope.ctrl.map.data.addListener('click', scope.ctrl.fixTooltip);
                // --- once finished, remove this listener ---
                google.maps.event.removeListener(listener);
            }
        }
    }
})();

