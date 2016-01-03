(function () {

    'use strict';

    angular.module('app.readelections', [])
        // --- controller ---
        .controller('ElectionsCtrl', ['ReadJSON', 'Utils', '$q', '$scope', initMap]);

    function initMap(ReadJSON, Utils, $q, $scope) {
        console.info("ElectionsCtrl starts...", ReadJSON);
        var settingsPromise = ReadJSON.getData("settings.json");

        var self = this;
        self.settings = {};
        self.map = {};
        self.elections = [];
        self.labelList = [];
        self.focusElection = {};
        self.focusLabel = "";
        self.max = 25;
        self.electionsLoaded = false;
        self.reloadColor = reloadColor;
        self.colorScale = [];
        self.textScale = [];
        self.electionButtons = [];
        self.changeElection = changeElection;
        self.openTooltip = openTooltip;
        self.closeTooltip = closeTooltip;
        self.fixTooltip = fixTooltip;
        self.tooltipArea = {};
        self.displayTooltip = false;
        self.tooltipFixed = null;
        self.getAreaAbstentionRatio = getAreaAbstentionRatio;
        self.switchDisplayMarkerCriteria = switchDisplayMarkerCriteria;
        self.displayMarkerCriteria = false;

        settingsPromise.then(readAllElections);

        // internal functions defined here in order to access variable self
        function readAllElections(response) {
            self.settings = response;
            var promises = [];
            for (var i in self.settings.elections) {
                promises.push( ReadJSON.getData(self.settings.elections[i]) ); //.then(readOneElection);
            }
            
            $q.all(promises).then(readElections);
        }
            
        function readElections(responses)
        {
            for ( var i in responses )
            {
                readOneElection(responses[i])
                
                // evolution button - only if this is not the first election
                if (i != 0) {
                    self.electionButtons.push({
                        "isEvo": true,
                        "before": self.elections[i-1].path,
                        "after": self.elections[i].path
                    });
                }
                
                // election button
                self.electionButtons.push({
                    "isEvo": false,
                    "path": self.elections[i].path,
                    "name": self.elections[i].election.button,
                    "selected": (self.settings.defaultElection === self.elections[i].path)
                });
            }
            
            // set focus election - and corresponding label list
            self.focusElection = Utils.findDefaultElection(self.settings, self.elections);
            if (self.focusElection) {
                // console.log("focusElection ready here", self.focusElection);
                self.labelList = Utils.computeSortedLabelList(self.settings, self.focusElection.election);
            }
            
            console.info("buttons: ", self.electionButtons);
            
            self.electionsLoaded = true;
        }

        function readOneElection(response) {
            var election = {
                'path': response.path,
                'election': response
            };
            self.elections.push(election);
            
            self.focusLabel = self.settings.defaultLabel;
            self.max = self.settings.defaultMaxScore;
            self.colorScale = Utils.calcColorScale(self.settings, self.focusLabel, self.max);
            self.textScale = Utils.calcTextScale(self.max);
        }

        function reloadColor() {
            console.info("reload map with label ", self.focusLabel, " and max ", self.max);
            Utils.changeElection(self.settings, self.focusElection, self.map, self.focusLabel, self.max, /*init=*/ false);
            self.colorScale = Utils.calcColorScale(self.settings, self.focusLabel, self.max);
            self.textScale = Utils.calcTextScale(self.max);
        }
        
        function changeElection(button) {
            console.info("Click on button ", button);
            
            // remove selected setting on buttons + ad it to newly clicked one.
            for ( var index in self.electionButtons )       self.electionButtons[index].selected = false;
            button.selected = true;
            
            self.focusElection = Utils.findElection( button.path, self.elections );
            // console.log("found election: ", self.focusElection);
            if ( self.focusElection )       reloadColor();
        }
        
        function openTooltip(event) {
            // open new tooltip only if one is not already fixed
            if ( ! self.tooltipFixed )
            {
                self.displayTooltip = true;
                self.tooltipArea = Utils.getAreaFromPolygon(event.feature, self.focusElection);
                if ( self.tooltipArea )
                {
                    self.tooltipArea.Name = event.feature.getProperty("Name");
                    Utils.fillLabelColorsInArea(self.settings, self.tooltipArea);
                    $scope.$apply();
                }
                // console.log("openTooltip", self.displayTooltip, self.tooltipArea);
            }
        }
        
        function closeTooltip(event) {
            // close tooltip only if not fixed
            if ( ! self.tooltipFixed )
            {
                self.displayTooltip = false;
                $scope.$apply();
            }
        }
        
        function fixTooltip(event) 
        {
            // console.log(event.feature);
            var newName = event.feature.getProperty("Name");
            var oldName;
            if ( self.tooltipFixed )    oldName = self.tooltipFixed.feature.getProperty("Name");
            
            // area is already fixed, click on same area - stop fixing the tooltip
            if ( self.tooltipFixed && oldName === newName)          
            {
                self.tooltipFixed = null;
                self.map.data.revertStyle(event.feature);
            }
            // click on another area, fix this one
            else if ( self.tooltipFixed && oldName !== newName)     
            {
                self.map.data.revertStyle();
                self.tooltipFixed = null;
                openTooltip(event);
                self.tooltipFixed = event;
                self.map.data.overrideStyle(event.feature, {
                    strokeOpacity: 1,
                    strokeColor: 'red',
                    strokeWeight: 5
                });
            }
            else                        
            {
                self.tooltipFixed = event;
                self.map.data.overrideStyle(event.feature, {
                    strokeOpacity: 1,
                    strokeColor: 'red',
                    strokeWeight: 5
                });
            }
        }
        
        function getAreaAbstentionRatio(area)
        {
            return Utils.getAreaAbstentionRatio(area);
        }
        
        function switchDisplayMarkerCriteria()
        {
            self.displayMarkerCriteria = ( ! self.displayMarkerCriteria );
        }
    }
})();
