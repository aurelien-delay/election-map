

function loadMun2014JSON()
{
    return $.ajax({
        type: "GET",
        url: "municipales_2014_resultats.json",
        processData : true,
        data: {},
        dataType: "json",
        error: function(x,y,z) {
        console.log(x);
        console.log(y);
        console.log(z);
        }
    }); 
}

function loadDep2015JSON()
{
    return $.ajax({
        type: "GET",
        url: "departementales_2015_resultats.json",
        processData : true,
        data: {},
        dataType: "json",
        error: function(x,y,z) {
        console.log(x);
        console.log(y);
        console.log(z);
        }
    });
}

function getColorForLabel(label)
{
    if ( label === "FDG" )   return 'red';
    if ( label === "PS"  )   return 'hotpink';
    if ( label === "UMP" )   return 'Blue';
    if ( label === "FN"  )   return 'Brown';
    if ( label === "FN"  )   return 'Brown';
    if ( label === "SE"  )   return 'Gray';
    if ( label === "DVD" )   return 'RoyalBlue';

}

function setStyle(feature)
{
    //console.log(feature.getProperty("bv_id"));
    var bvid = feature.getProperty("bv_id");
    if ( bvid >= 100 && bvid < 200 )            map.data.overrideStyle(feature, {strokeColor: 'CornflowerBlue'});
    else if ( bvid >= 200 && bvid < 300 )       map.data.overrideStyle(feature, {strokeColor: 'Crimson'});
    else if ( bvid >= 300 && bvid < 400 )       map.data.overrideStyle(feature, {strokeColor: 'orange'});
    else if ( bvid >= 2500 && bvid < 2600 )     map.data.overrideStyle(feature, {strokeColor: 'green'});
}

function getLabelResultatInBureau(bureau, label)
{
    //console.log(labelFocus)
    for (i = 0 ; i < bureau.resultats.length ; ++i)
    {
        if ( bureau.resultats[i].label === label )
        {
            return bureau.resultats[i];
        }
    }
}

function getBureauFromPolygon(feature, electionResult)
{
    // console.log(feature);
    for (i = 0 ; i < electionResult.bureaux.length ; ++i)
    {
        bv_id = electionResult.bureaux[i].bv_id;
        if ( bv_id === feature.getProperty("bv_id") )
        {
            //console.log(loadedElectionResult.bureaux[i]);
            return electionResult.bureaux[i];
        }

    }
}

function getMaxScore()
{
    return document.getElementById("slider").value;
}

function getColorFromScore(label, score)
{
    var max = getMaxScore();
    f = chroma.scale(['white', getColorForLabel(label)]).domain([0, max]).classes(10);
    var ocolor = f(score).hex();
    //console.log(score + " : " + ocolor);
    return ocolor;
}

function getColorFromEvoScore(score)
{
    f = chroma.scale(['red', 'white', 'green']).domain([-30,0,30]).classes(12);
    var ocolor = f(score).hex();
    //console.log(score + " : " + ocolor);
    return ocolor;
}

function computeChartColorList(labelList)
{
    var output = [];
    // --- get color from label and fill output ---
    for ( i in labelList )   { output.push( getColorForLabel(labelList[i]) ); }
    
    // --- make sure output as 10 as length and complete with dummy colors ---
    while ( output.length < 10 )    { output.push( "black" ); }
    
    return output;
}

function setButtonClicked(button)
{
    // --- first remove the class elecButtonClicked on all buttons ---
    var buttons = document.getElementsByClassName("elecButton");
    for (i = 0 ; i < buttons.length ; ++i )
    {
        $(buttons[i]).removeClass("elecButtonClicked");
    }

    // --- then add it to the input button ---
    $(button).addClass("elecButtonClicked");
}

function computeLabelList(election_result)
{
    var output = {}; // will use the 'Object' to simulate a std::set
    for ( i = 0 ; i < election_result.bureaux.length ; ++i )
    {
        var bureau = election_result.bureaux[i];
        for ( j = 0 ; j < bureau.resultats.length ; ++j )
        {
            var resultat = bureau.resultats[j];
            output[resultat.label] = true; // Don't care about the true.
        }
    }
    return output;
}

function compareLabel(lhs, rhs)
{
    // REMINDER : if (lhs < rhs) return -1, if (lhs === rhs) return 0, if (lhs > rhs) return 1
    // --- trivial ---
    if ( lhs === rhs )      return 0;
    
    // --- sort labels from left to right politically ---
    // ie: FDG < PS < SE < DVD < UMP < FN
    if  ( lhs === "FDG" )       return -1;
    
    if  ( lhs === "PS" )
    {
        if (rhs in {"FDG":1})                               return  1;
        else                                                return -1;
    }
    
    if  ( lhs === "SE" )
    {
        if (rhs in {"FDG":1, "PS":1})                       return  1;
        else                                                return -1;
    }
    
    if  ( lhs === "DVD" )
    {
        if (rhs in {"FDG":1, "PS":1, "SE":1})               return  1;
        else                                                return -1;
    }
    
    if  ( lhs === "UMP" )
    {
        if (rhs in {"FDG":1, "PS":1, "SE":1, "DVD":1})      return  1;
        else                                                return -1;
    }
    
    if  ( lhs === "FN" )
    {
        if (rhs in {"FDG":1, "PS":1, "SE":1, "UMP":1})      return  1;
        else                                                return -1;
    }
    
    // should never got there...
    return -1;
}

function sortLabelList(labeList)
{
    return ( Object.keys(labeList).sort(compareLabel) );
}

function setSlider(sliderActivated)
{
    if ( sliderActivated )
    {
        document.getElementById("slider").disabled =false;
        document.getElementById("sliderValue").disabled =false;
        document.getElementById("sliderColorScale").className ="sliderColorScale";
    }
    else
    {
        document.getElementById("slider").disabled =true;
        document.getElementById("sliderValue").disabled =true;
        document.getElementById("sliderColorScale").className ="sliderColorScaleDisabled";
    }
}

function generateScaleColorPercentile(index, label, isEvo)
{
    var spanoutput = document.createElement("span");
    spanoutput.className = "percentile";
    var color;
    if ( isEvo )        color = getColorFromEvoScore(index);
    else                color = getColorFromScore(label, index);
    spanoutput.style.backgroundColor = color;
    spanoutput.style.opacity= 0.7;
    var width = ( isEvo ? (100/12) : 10 );
    spanoutput.style.width = width+"%";
    return spanoutput;
}

function generateScaleMilestones(number, cssclass)
{
    var spanoutput = document.createElement("span");
    spanoutput.className = cssclass;
    spanoutput.appendChild(document.createTextNode(number));
    return spanoutput;
}

function calculateMilestones(step, max)
{
    return Math.round( step*max/100 );
}