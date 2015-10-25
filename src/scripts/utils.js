(function () {
    'use strict';

    angular.module("app.utils", [])
        .factory("Utils", ["ReadJSON", setUtils]);

    function setUtils(ReadJSON) {
        var Utils = {};

        Utils.computeSortedLabelList = computeSortedLabelList;
        Utils.findElection = findElection;
        Utils.findDefaultElection = findDefaultElection;

        Utils.changeElection = changeElection;
        Utils.calcColorScale = calcColorScale;
        Utils.calcTextScale = calcTextScale;
        
        Utils.getAreaFromPolygon = getAreaFromPolygon;
        Utils.getColorFromLabel = getColorFromLabel;
        Utils.fillLabelColorsInArea = fillLabelColorsInArea;
        
        Utils.drawResultPieChart = drawResultPieChart;
        Utils.drawAbstentionPieChart = drawAbstentionPieChart;
        Utils.getAreaAbstentionRatio = getAreaAbstentionRatio;

        return Utils;
    }

    function findElection(path, elections) {
        // --- loop on elections and find the one reference in default option ---
        for (var index in elections) {
            if (elections[index].path === path) return elections[index];
        }

        // --- found nothing ---
        return null;
    }

    function findDefaultElection(settings, elections) {
        // --- trivial cases ---
        if (elections.length === 0) return undefined;
        if (elections.length === 1) return elections[0];
        if (settings.defaultElection === undefined) return elections[0];

        // --- loop on elections and find the one reference in default option ---
        var foundElection = findElection(settings.defaultElection, elections);

        // --- return found election. if none found, return first election ---
        if (foundElection === null) return elections[0];
        return foundElection;
    }

    function computeSortedLabelList(settings, election_result) {
        var output = [];
        var labelDone = {}; // will use the 'Object' to simulate a std::set
        for (var i = 0; i < election_result.bureaux.length; ++i) {
            var bureau = election_result.bureaux[i];
            for (var j = 0; j < bureau.resultats.length; ++j) {
                var resultat = bureau.resultats[j];

                // if label already set in output, nothing to do
                if (labelDone.hasOwnProperty(resultat.label)) continue;

                var labelObj = {
                    'label': resultat.label
                };

                // if label is default, set it as selected
                labelObj.selected = (settings.defaultLabel === resultat.label);

                // search for label color in settings
                if (resultat.label in settings.labelColor) labelObj.color = settings.labelColor[resultat.label];
                else labelObj.color = settings.emptyColor;

                // set result in output, and set the label as already processed.
                output.push(labelObj);
                labelDone[resultat.label] = true;
            }
        }

        // sort labels according to order set in settings
        output.sort(compareLabel);
        return output;


        // compare defined here in order to access settings variable
        function compareLabel(lhs, rhs) {
            // get index in labelOrder for lhs and rhs
            var lindex;
            var rindex;
            for (var i in settings.labelOrder) {
                if (settings.labelOrder[i] === lhs.label) lindex = i;
                else if (settings.labelOrder[i] === rhs.label) rindex = i;
                if (lindex && rindex) break;
            }

            // compare the index 
            if (lindex && rindex) return (lindex > rindex);
            // trivial cases
            else if (lindex) return -1;
            else return 1;
        }
    }

    function changeElection(settings, election, map, focusLabel, max, init) {
        //console.info("change election ", settings, focusLabel);
        
        var labelColor = getColorFromLabel(settings, focusLabel);
        
        if (init) {
            var listener = map.addListener('idle', afterMapLoaded);
        } else {
            // map.data.forEach(colorOneVotingArea);
            map.data.setStyle( colorOneVotingArea );
        }

        function afterMapLoaded(event) {
            // console.info("after load map");
            // map.data.forEach(colorOneVotingArea);
            map.data.setStyle( colorOneVotingArea );

            // --- once finished, remove this listener ---
            google.maps.event.removeListener(listener);
        }
        
        function colorOneVotingArea(feature) {
            var area = getAreaFromPolygon(feature, election);
            // console.log("color area: ", area);
            if (!area) {
                // console.log("could not find bureau");
                return {fillColor: settings.emptyColor, fillOpacity: settings.opacity, strokeOpacity: settings.opacity};
            }

            var resultat = getLabelResultInBureau(area, focusLabel);
            if (!resultat) {
                // console.log("could not find resultat");
                return {fillColor: settings.emptyColor, fillOpacity: settings.opacity, strokeOpacity: settings.opacity};
            }

            var score = resultat.ratio_exprimes;
            // console.log(resultat.ratio_exprimes);
            var colorFromScore = getColorFromScore(labelColor, score, max);
            /*
            if ( isEvo)         colorFromScore = getColorFromEvoScore(score);
            else                colorFromScore = getColorFromScore(focusLabel, score);
            */
            return {
                fillColor: colorFromScore,
                fillOpacity: settings.opacity,
                strokeOpacity: settings.opacity
            };
        }
    }
    
    function calcColorScale(settings, focusLabel, max){
        var labelColor = getColorFromLabel(settings, focusLabel);
        var output = [];
        for ( var index = 0 ; index < 10 ; ++index )
        {
            var step = (max*index/10);
            var color = getColorFromScore(labelColor, step, max);
            var percentile = { "width":"10%", "opacity":settings.opacity, "background-color":color };
            output.push(percentile);
            
        }
        return output;
    }
    
    function calcTextScale(max){
        var output = [];
        for ( var index = 0 ; index <= 10 ; ++index )
        {
            var text = calculateMilestones(index*10, max);
            var left = (index*10 - 5) + "%"
            var right = (95 - index*10) + "%"
            var percentile = { "text":text, "left":left, "right":right };
            output.push(percentile);

        }
        return output;
    }
    
    function getColorFromLabel(settings, label) {
        // console.log(settings, label);
        if ( label === "abstention" )   return (settings.abstentionColor || "Black");
        return (settings.labelColor[label] || "Black");
    }
    
    function fillLabelColorsInArea(settings, area) {
        for ( var i in area.resultats ) {
            var result = area.resultats[i];
            result.color = getColorFromLabel(settings, result.label);
        }   
    }

    function getAreaFromPolygon(feature, election) {
        // console.log(feature, election);
        for (var i in election.election.bureaux) {
            var va_id = election.election.bureaux[i].va_id;
            if (va_id === feature.getProperty("va_id")) {
                return election.election.bureaux[i];
            }
        }
    }
    
    function getAreaAbstentionRatio(area)
    {
        var abtentationAbs = (area.inscrits - area.exprimes);
        var abstentionRatio = ( abtentationAbs*100 / area.inscrits ).toFixed(2);
        return abstentionRatio;
    }

    function getLabelResultInBureau(area, label) {
        //console.log(focusLabel)
        // --- special case : abstention calculated from inscrits and exprimes at area level ---
        if ( label === "abstention" )   
        {
            var abtentationAbs = (area.inscrits - area.exprimes);
            var abstentionRatio = ( abtentationAbs*100 / area.inscrits );
            return {"ratio_exprimes":abstentionRatio, "nb_voix":abtentationAbs};
        }
        
        // --- normal case : search for label in results ---
        for (var i in area.resultats) {
            if (area.resultats[i].label === label) return area.resultats[i];
        }
    }

    function getColorFromScore(color, score, max) {
        var f = chroma.scale(['white', color]).domain([0, max]).classes(10);
        var ocolor = f(score).hex();
        //console.log(score + " : " + ocolor);
        return ocolor;
    }
    
    function calculateMilestones(step, max)
    {
        return Math.round( step*max/100 );
    }
    
    function drawResultPieChart(settings, area, element)
    {
        // --- create the data table ---
        var data = new google.visualization.DataTable();
        data.addColumn('string', 'label');
        data.addColumn('number', 'Voix');

        // --- fill table with the resultats for all labels in area ---
        var labelList = computeSortedLabelList(settings, area.resultats);
        for ( i in labelList )
        {
            var label = labelList[i];
            var result = getLabelResultInBureau(area, label);
            data.addRow([label, result.nb_voix]);
        }

        // --- compute color list from label list ---
        var colorList = computeChartColorList(settings, labelList);

        // --- set chart option ---
        var options = {
            pieSliceText: 'none',
            'width':300, 'height':200,
            pieStartAngle: 270,
            legend: {position: 'none'},        
            slices: { 0: { color: colorList[0] }, 1: { color: colorList[1] }, 2: { color: colorList[2] }, 3: { color: colorList[3] },
                     4: { color: colorList[4] }, 5: { color: colorList[5] }, 6: { color: colorList[6] }, 7: { color: colorList[7] },
                     8: { color: colorList[8] }, 9: { color: colorList[9] }, 10: { color: colorList[10]}, 11: { color: colorList[11]},
                     12: { color: colorList[12] }, 13: { color: colorList[13] }, 14: { color: colorList[14]}, 15: { color: colorList[15]},
                     16: { color: colorList[16] }, 17: { color: colorList[17] }, 18: { color: colorList[18]}, 19: { color: colorList[19]},
                     20: { color: colorList[20] }, 21: { color: colorList[21] }, 22: { color: colorList[22]}, 23: { color: colorList[23]},
                     24: { color: colorList[24] }, 25: { color: colorList[25] }, 26: { color: colorList[26]}, 27: { color: colorList[27]},
                     28: { color: colorList[28] }, 29: { color: colorList[29] }, 30: { color: colorList[30]}, 31: { color: colorList[31]},
                     32: { color: colorList[32] }, 33: { color: colorList[33] }, 34: { color: colorList[34]}, 35: { color: colorList[35]},
                     36: { color: colorList[36] }, 37: { color: colorList[37] }, 38: { color: colorList[38]}, 39: { color: colorList[39]},
                     40: { color: colorList[40] }, 41: { color: colorList[41] }, 42: { color: colorList[42]}, 43: { color: colorList[43]},
                     44: { color: colorList[44] }, 45: { color: colorList[45] }, 46: { color: colorList[46]}, 47: { color: colorList[47]},
                     48: { color: colorList[48] }, 49: { color: colorList[49] }, 50: { color: colorList[50]}
                    }
        };

        // --- set the chart in div ---
        var chart = new google.visualization.PieChart(element);
        chart.draw(data, options);
    }
    
    function drawAbstentionPieChart(settings, area, element){
        // --- create the data table ---
        var data = new google.visualization.DataTable();
        data.addColumn('string', 'label');
        data.addColumn('number', 'Voix');

        // --- fill table with just exprimes vs abstention ---
        var abtentationAbs = (area.inscrits - area.exprimes);
        data.addRow(["Abstention", abtentationAbs]);
        data.addRow(["", area.exprimes]);

        // --- set chart option ---
        var options = {
            pieSliceText: 'none',
            'width':300, 'height':200,
            pieStartAngle: 270,
            legend: {position: 'none'},        
            slices: { 0: { color: settings.abstentionColor }, 1: { color: "#eee" } }
        };

        // --- set the chart in div ---
        var chart = new google.visualization.PieChart(element);
        chart.draw(data, options);
    }
    
    function computeChartColorList(settings, labelList)
    {
        var output = [];

        // --- get color from label and fill output ---
        for ( i in labelList )   { output.push( getColorFromLabel(settings, labelList[i]) ); }

        // --- make sure output as 50 as length and complete with dummy colors ---
        while ( output.length < 50 )    { output.push( "black" ); }    
        return output;
    }
    
    
})();
