var map;
var infowindow;
var labelFocus;
var munip2014JSON;
var depar2015JSON;
var loadedElectionResult;
var isEvo = false;
var maxScorePerLabel = {};

function initMap()
{    
    // --- read focused label variable ---
    labelFocus = "FDG";
    //console.log(labelFocus);
    
    // --- display color scale ---
    displayColorScale( getMaxScore() );

    // --- initial map settings ---
    map = new google.maps.Map(document.getElementById('map'),
    {
        zoom: 13,
        center: {lat: 43.587892, lng: 7.104552}
    });

    // --- load bureaux de vote's perimneters ---
    // NOTE: This uses cross-domain XHR, and may not work on older browsers.
    map.data.loadGeoJson('bureaux_antibes_2015.json');
    map.data.setStyle({fillColor: 'black', fillOpacity: 0.4});

    // --- set border color according to cantons ---
    // wait for GeoJSON to be loaded
    var listener = map.addListener('idle', function(event) 
    { 
        // --- set the general style for the map ---
        map.data.forEach(setStyle);
    
        // --- load the different JSON files with election result ---
        var munip2014Deffered = loadMun2014JSON();
        var depar2015Deffered = loadDep2015JSON();

        // --- by default, click the departmentales 2015 button and color the map ---
        $.when( munip2014Deffered, depar2015Deffered ).done( function(a1,a2)
        {
            console.log("load done");
            munip2014JSON = a1[0];
            depar2015JSON = a2[0];

            setDepartementales2015(document.getElementById("dep2015"));
            
            // --- once this is played, we do not want to trigger the event again ---
            google.maps.event.removeListener(listener);
            
            // --- Display score when cliking on bureaux de vote ---
            infowindow = new google.maps.InfoWindow();
            map.data.addListener('click', openInfoboxEvent);
        });
    } );
}

function openInfoboxEvent(event)
{
    var bureau = getBureauFromPolygon(event.feature, loadedElectionResult);
    var content;
    if (bureau)
    {
        content = document.createElement('div');
        if (isEvo)          content.className = "inforesultEvo";
        else                content.className = "inforesult";


        var pbureau = document.createElement('p');
        pbureau.appendChild(document.createTextNode("Bureau numero " + bureau.bv_id));
        pbureau.appendChild(document.createElement('br'));
        pbureau.appendChild(document.createTextNode(event.feature.getProperty("Name")));
        content.appendChild(pbureau);

        for ( i = 0 ; i < bureau.resultats.length ; ++i )
        {
            var resultat = bureau.resultats[i];
            var presult = document.createElement('p');

            if ( !isEvo )
            {
                var spantete = document.createElement('span');
                spantete.className = "tete " + resultat.label;
                spantete.appendChild(document.createTextNode(resultat.tete));
                presult.appendChild(spantete);
            }
            
            var spanLabel = document.createElement('span');
            spanLabel.className = "label " + resultat.label;
            spanLabel.appendChild(document.createTextNode(resultat.label));
            presult.appendChild(spanLabel);

            var spanscore = document.createElement('span');
            spanscore.className = "score ";
            var plusSign = (isEvo && resultat.ratio_exprimes >= 0 ? "+" : "" );
            spanscore.appendChild(document.createTextNode(plusSign + resultat.ratio_exprimes.toFixed(2) + " %"));
            presult.appendChild(spanscore);

            content.appendChild(presult);
        }

        if ( !isEvo)        drawPieChart(bureau, content);
    }
    else
    {
        content = "<p>Pas de résultat pour ce bureau de vote." + "<br>" + event.feature.getProperty("Name") + "</p>";
    }

    setTimeout( function()
    {
        infowindow.setContent(content);
        infowindow.setPosition(event.latLng);
        //infowindow.setOptions({'maxWidth':'500px'});
        infowindow.open(map);
    },0);
}


function colorBV()
{
    // console.log("colorBV");
    map.data.forEach(colorOneBV);
}

function colorOneBV(feature)
{
    //console.log(feature.getProperty("bv_id"));
    //console.log("colorOneBV");
    bureau = getBureauFromPolygon(feature, loadedElectionResult);
    if (!bureau)
    {
        // --- paint it black ---
        // console.log("could not find bureau");
        map.data.overrideStyle(feature, {fillColor: 'black', fillOpacity: 0.4});
        return;
    }

    var resultat = getLabelResultatInBureau( bureau, labelFocus );
    if (!resultat)
    {
        // --- paint it black ---
        // console.log("could not find resultat");
        map.data.overrideStyle(feature, {fillColor: 'black', fillOpacity: 0.4});
        return;
    }

    var score = resultat.ratio_exprimes;
    //console.log(resultat.ratio_exprimes);
    var colorFromScore;
    if ( isEvo)         colorFromScore = getColorFromEvoScore(score);
    else                colorFromScore = getColorFromScore(labelFocus, score);
    map.data.overrideStyle(feature, {fillColor: colorFromScore, fillOpacity: 0.7});
}

function drawPieChart(bureau, content)
{
    // --- create the data table ---
    var data = new google.visualization.DataTable();
    data.addColumn('string', 'label');
    data.addColumn('number', 'Voix');

    // --- fill table with the resultats for all labels in bureau ---
    var labelList = [];
    for ( i = 0 ; i < bureau.resultats.length ; ++i )
    {
        var resultat = bureau.resultats[i];
        data.addRow([resultat.label, resultat.nb_voix]);
        labelList.push(resultat.label);
    }
    labelList.sort(compareLabel);
    
    // --- compute color list from label list ---
    var colorList = computeChartColorList(labelList);

    // --- set chart option ---
    var options = {
        pieSliceText: 'none',
        'width':300, 'height':200,
        legend: {position: 'none'},        
        slices: { 0: { color: colorList[0] }, 1: { color: colorList[1] }, 2: { color: colorList[2] }, 3: { color: colorList[3] },
                  4: { color: colorList[4] }, 5: { color: colorList[5] }, 6: { color: colorList[6] }, 7: { color: colorList[7] },
                  8: { color: colorList[8] }, 9: { color: colorList[9] } }
      };

    // --- create new div, and set the chart in it ---
    var newdiv = document.createElement('div');
    content.appendChild(newdiv);
    var chart = new google.visualization.PieChart(newdiv);
    chart.draw(data, options);
}

function changeFocus(radio)
{
    console.log("change focus from " + labelFocus + " to " + radio.value);
    labelFocus = radio.value;
    if ( !isEvo)        displayColorScale( getMaxScore() );
    colorBV(loadedElectionResult);
}

function setMunicipales2014(button)
{
    isEvo = false;
    displayColorScale( getMaxScore() );
    setSlider(!isEvo);
    setButtonClicked(button);
    election="municipales_2014";
    changeElection(election);
}

function setDepartementales2015(button)
{
    isEvo = false;
    displayColorScale( getMaxScore() );
    setSlider(!isEvo);
    setButtonClicked(button);
    election="departementales_2015";
    changeElection(election);
}

function setEvoMun14Dep15(button)
{
    isEvo = true;
    displayColorScaleEvo();
    setSlider(!isEvo);
    setButtonClicked(button);
    election="evo_mun14_dep15";
    changeElection(election);
}

function changeElection(election)
{
    console.log("change election");
    // --- read the JSON file and color the map with the content ---
    // NOTE: MUST be done first since it will change loadloadedElectionResult, used later...
    if          (election === "municipales_2014" )           loadedElectionResult = munip2014JSON;
    else if     (election === "departementales_2015"  )      loadedElectionResult = depar2015JSON;
    else if     (election === "evo_mun14_dep15")             loadedElectionResult = calculationEvolution(munip2014JSON, depar2015JSON);
    else                                                         return;
    console.log(loadedElectionResult);

    // --- set the list of possible focus label ---
    var labelList = computeLabelList(loadedElectionResult);
    writeLabelList(labelList);

    // --- color the map with the input election result ---
    colorBV();
}

function writeLabelList(labelList)
{
    var infobox = document.getElementById("info-box");
    // remove all previous labels
    while (infobox.hasChildNodes())     {   infobox.removeChild(infobox.lastChild); }

    // if focus label is not in new label list, set FDG as its default value.
    if ( !(labelFocus in labelList) )       labelFocus = 'FDG';

    // add the new ones
    var sortedLabelList = sortLabelList(labelList);
    console.log(sortedLabelList);
    for ( i in sortedLabelList )
    {
        var label = sortedLabelList[i];
        // <p class="FDG"> <input type="radio" id="label" name="labelFocus" onclick="changeFocus(this);" value="FDG" checked/>FDG</p>
        var plabel = document.createElement('p');
        plabel.className = label;

        var input = document.createElement("input");
        input.type = "radio";
        input.id = "label";
        input.name = "labelFocus";
        input.onclick = function() { changeFocus(this); };
        input.value = label;
        if ( label === labelFocus )     input.checked = true;
        // console.log(plabel);

        plabel.appendChild(input);
        plabel.appendChild(document.createTextNode(label));
        infobox.appendChild(plabel);
    }
    console.log(labelList);
}

function calculationEvolution(first, second)
{
    var output = { bureaux:[] };
    // loop on bureaux, 
    // when matching find the resultats for the focus label 
    // and calculate the difference in ratio_exprimes
    for ( var i in first.bureaux )
    {
        for ( var j in second.bureaux )
        {
            var bureau1 = first.bureaux[i];
            var bureau2 = second.bureaux[j];
            if ( bureau1.bv_id === bureau2.bv_id )
            {
                var evoBV = { bv_id:bureau1.bv_id, resultats:[] };
                for ( var k in bureau1.resultats )
                {
                    for ( var l in bureau2.resultats )
                    {
                        var resultat1 = bureau1.resultats[k];
                        var resultat2 = bureau2.resultats[l];
                        if ( resultat1.label === resultat2.label )
                        {
                            // --- init with one of the result and change the values with the diff ---
                            var evoResult=JSON.parse(JSON.stringify(resultat2));
                            evoResult.nb_voix           = ( resultat2.nb_voix           - resultat1.nb_voix         );
                            evoResult.ratio_exprimes    = ( resultat2.ratio_exprimes    - resultat1.ratio_exprimes  );
                            evoBV.resultats.push(evoResult);
                        }
                    }
                }
                output.bureaux.push(evoBV);
                // console.log(evoBV);
            }
        }
    }
    
    console.log(output);
    return output;
}

function colorWithNewScale(newValue)
{
    document.getElementById("slider").value=newValue;
    document.getElementById("sliderValue").value=newValue;
    displayColorScale(newValue);
    colorBV();
}

function displayColorScale(newMax)
{
    var scalediv = document.getElementById("colorscale");
    // --- first remove all elements in div ---
    while (scalediv.hasChildNodes())     {   scalediv.removeChild(scalediv.lastChild); }
    
    // --- for each percentile, add a span with its corresponding background color ---
    for ( index = 0 ; index < 10 ; ++index )
    {
        var step = (newMax*index/10);
        scalediv.appendChild( generateScaleColorPercentile(step, labelFocus, false) );
    }
    
    // --- also add numeric milestones ---
    scalediv.appendChild(generateScaleMilestones(0, "domain-0"));
    scalediv.appendChild(generateScaleMilestones(calculateMilestones(10, newMax), "domain-10"));
    scalediv.appendChild(generateScaleMilestones(calculateMilestones(20, newMax), "domain-20"));
    scalediv.appendChild(generateScaleMilestones(calculateMilestones(30, newMax), "domain-30"));
    scalediv.appendChild(generateScaleMilestones(calculateMilestones(40, newMax), "domain-40"));
    scalediv.appendChild(generateScaleMilestones(calculateMilestones(50, newMax), "domain-50"));
    scalediv.appendChild(generateScaleMilestones(calculateMilestones(60, newMax), "domain-60"));
    scalediv.appendChild(generateScaleMilestones(calculateMilestones(70, newMax), "domain-70"));
    scalediv.appendChild(generateScaleMilestones(calculateMilestones(80, newMax), "domain-80"));
    scalediv.appendChild(generateScaleMilestones(calculateMilestones(90, newMax), "domain-90"));
    scalediv.appendChild(generateScaleMilestones(100, "domain-100"));
}

function displayColorScaleEvo()
{
    var scalediv = document.getElementById("colorscale");
    // --- first remove all elements in div ---
    while (scalediv.hasChildNodes())     {   scalediv.removeChild(scalediv.lastChild); }
    
    // --- for each percentile, add a span with its corresponding background color ---
    for ( index = 0 ; index < 12 ; ++index )
    {
        var step = ( (60*index/12) - 30 );
        scalediv.appendChild( generateScaleColorPercentile(step, labelFocus, true) );
    }
    
    // --- also add numeric milestones ---
    scalediv.appendChild(generateScaleMilestones(-30, "domain-0"));
    scalediv.appendChild(generateScaleMilestones(-20, "domain-17"));
    scalediv.appendChild(generateScaleMilestones(-10, "domain-33"));
    scalediv.appendChild(generateScaleMilestones(  0, "domain-50"));
    scalediv.appendChild(generateScaleMilestones( 10, "domain-66"));
    scalediv.appendChild(generateScaleMilestones( 20, "domain-83"));
    scalediv.appendChild(generateScaleMilestones( 30, "domain-100"));
}