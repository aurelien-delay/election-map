
function compareElectionByDate(lhs, rhs)
{
    // --- trivial cases ---
    if ( lhs.date === undefined )       return true;
    if ( rhs.date === undefined )       return false;
    
    return ( Date(lhs.date) < Date(rhs.date) );
}



function getColorFromLabel( label )
{
    return ( settings.labelColor[label] || "Black" );
}

function setStyle(feature)
{
    // console.log(feature.getProperty("va_id"));
    var bvid = feature.getProperty("va_id");
    if ( bvid >= 100 && bvid < 200 )            map.data.overrideStyle(feature, {strokeColor: 'CornflowerBlue'});
    else if ( bvid >= 200 && bvid < 300 )       map.data.overrideStyle(feature, {strokeColor: 'Crimson'});
    else if ( bvid >= 300 && bvid < 400 )       map.data.overrideStyle(feature, {strokeColor: 'orange'});
    else if ( bvid >= 400 && bvid < 500 )       map.data.overrideStyle(feature, {strokeColor: 'green'});
}

function getLabelResultatInBureau(bureau, label)
{
    //console.log(focusLabel)
    for (i = 0 ; i < bureau.resultats.length ; ++i)
    {
        if ( bureau.resultats[i].label === label )
        {
            return bureau.resultats[i];
        }
    }
}

function getAreaFromPolygon(feature, electionResult)
{
    // console.log(feature, electionResult);
    for (i in electionResult.bureaux )
    {
        va_id = electionResult.bureaux[i].va_id;
        if ( va_id === feature.getProperty("va_id") )
        {
            //console.log(loadedElectionResult.bureaux[i]);
            return electionResult.bureaux[i];
        }
    }
}

function getColorFromScore(label, score)
{
    var max = getMaxScore();
    f = chroma.scale(['white', getColorFromLabel(label)]).domain([0, max]).classes(10);
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
    for ( i in labelList )   { output.push( getColorFromLabel(labelList[i]) ); }
    
    // --- make sure output as 10 as length and complete with dummy colors ---
    while ( output.length < 50 )    { output.push( "black" ); }    
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
    spanoutput.style.opacity= 0.4;
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

function getLabelsFromAreaResultList( resultList )
{
    var labellist = [];
    for ( i in resultList )
    {
        labellist.push(resultList[i].label);
    }
    labellist.sort(compareLabel);
    return labellist;
}

function getResultFromLabel( label, resultList )
{
    for ( i in resultList )
    {
        if ( resultList[i].label === label )    return resultList[i];
    }
    return undefined;
}