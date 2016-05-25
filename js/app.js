var apiKey, map, geojsonLayer;
var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
var ready = false;
var NYCgeojson;

var variables = [];

var boroughs = {
    "Staten Island": 0,
    "Queens": 1,
    "Brooklyn": 2,
    "Manhattan": 3,
    "Bronx": 4,
    "All": 5
};

var currentBorough = 0;
var svg;
var text;
var plotTextElement;
var plotText = {
    'Bronx' : 'Over the years, the crime rate in Bronx has decreased, and housing rates have increased. Bronx is the least expensive of the boroughs in terms of housing rates.',
    'Manhattan' : 'Manhattan has had a fluctuating housing rate until 2000, after which there has been a steady increase. It is easily the most expensive borough in terms of housing. Crime rate has seen a decrease.',
    'Brooklyn' : 'Brooklyn ranks as the third most expensive borough for housing. From 1990, housing rates have increased and crime rates and decresed, however, it is also the highest in crime rate.',
    'Queens' : 'Queens is the second most expensive place to buy a house. However, it is less than half of the housing rate of Manhattan, which is the most expensive. Crime rate has decreased steadily over the years.',
    'Staten Island': 'Staten Island is the safest of all the NYC boroughs. It\'s crime rate is surprisingly much lower than the other boroughs, and has been on the decline over the years. Housing rates were on the rise, but seems to be stabilized over the late 2000s.',
    'All': 'This provide the overview of all boroughs. Average housing cost almost doubles within a decade, while crime rate dropped significantly overtime. (the solid line represent housing cost, while dashed line indicates felony)'
}

jQuery.getJSON("https://cdn.rawgit.com/dwillis/nyc-maps/master/boroughs.geojson", function(response) {
    ready = true;
    NYCgeojson = response;

    NYCgeojson.features[boroughs["Staten Island"]].properties.NAME = "Staten Island";
    NYCgeojson.features[boroughs["Queens"]].properties.NAME = "Queens";
    NYCgeojson.features[boroughs["Brooklyn"]].properties.NAME = "Brooklyn";
    NYCgeojson.features[boroughs["Manhattan"]].properties.NAME = "Manhattan";
    NYCgeojson.features[boroughs["Bronx"]].properties.NAME = "Bronx";
});

var sdk = new CitySDK();
var census = sdk.modules.census;

var mode = "geometry";

function getApiKey() {
    apiKey = "b9f91488e2b7f8eb36894b3c3ed7382598e487b4";//prompt("Enter your Census API Key","API Key");
    census.enable("b9f91488e2b7f8eb36894b3c3ed7382598e487b4");
};

function style() {
        
            return {
                weight: 10,
                opacity: 1,
                color: '#FF0000',
                dashArray: '3',
                fillOpacity: 1,
                fill: true,
                fillColor: '#ff0000'
            }
    }
$(document).ready(
        function() {
            getApiKey();
            text = document.getElementById("text");
            plotTextElement = document.getElementById('plottext');
            map = L.map('map', {zoomControl : false}).setView([40.7127, -74.0059], 10);
            
            L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
                attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
                minZoom: 10,
                maxZoom: 12,
                id: ['radhikabk.065mp68i'],
                accessToken: ['pk.eyJ1IjoicmFkaGlrYWJrIiwiYSI6ImNpb2Y0bTdxOTAwdWh5dm0yc250a2s4MG4ifQ.OXohB9JMXN_liaBsgWaZ6Q']
            }).addTo(map);

            $('.leaflet-control-attribution').hide();
            
            $('#myModal').modal('show');

            geojsonLayer = L.geoJson().addTo(map);
            geojsonLayer.eachLayer(function(layer) {
                    layer.setStyle({
                        fillColor: "#ff0000",
                        fillOpacity: 0.8,
                        weight: 0.5
                    });
                });
         
            $('#opener').on('click', function() {     
                var panel = $('#slide-panel');
                if (panel.hasClass("visible")) {
                    panel.removeClass('visible').animate({'margin-left':'-'+0.9*w+'px'});
                    $('#opener').html('<i class="fa fa-chevron-circle-right fa-2x" aria-hidden="true"></i>');
                } else {
                    panel.addClass('visible').animate({'margin-left':'0px'});
                    setTimeout(function(){
                        $('#opener').html('<i class="fa fa-chevron-circle-left fa-2x" aria-hidden="true"></i>');
                    },600)
                    
                }   
                return false;   
            });
        }
);
var q;
function split(x) {
    variables = [];
    $('#variableBox').val().split(",").forEach(function(s) {
        variables.push(s.trim());
    });

    var request = {
        container: mode,
        containerGeometry: census.GEOtoESRI(NYCgeojson.features[currentBorough]).geometry,
        sublevel: true,
        level: x,
        variables: variables
    };

    census.GEORequest(request, function(response) {
        response.features.forEach(function(f) {
            geojsonLayer.addData(f);
        });
    });
};

function clearMap() {
    geojsonLayer.clearLayers();
};

function plotBorough(x) {
    if(x=='All') {
        var keys = Object.keys(plotText);
        plotAllBoroughGraph(keys);
        for(var i=0; i<keys.length; i++) {
            currentBorough = boroughs[keys[i]];
            geojsonLayer.addData(NYCgeojson.features[currentBorough]);
            var bounds = geojsonLayer.getBounds();
            var center = bounds.getCenter();
            map.panTo(center)
        }
    }
    else {
        clearMap();
        currentBorough = boroughs[x];
        highlightBoroughLine(x);
        geojsonLayer.addData(NYCgeojson.features[currentBorough]);
        var bounds = geojsonLayer.getBounds();
        var center = bounds.getCenter();
        map.panTo(center)
    }

    text.innerHTML = x;
    if( $('#navbar-header').hasClass('in') ) {
        $('.navbar-toggler').click();
    }
};

function plotAllBoroughGraph(boroughs) {
    for(var i =0; i< boroughs.length; i++) {
        var x = boroughs[i];
        x = x.replace(" ","-");
        svg.selectAll(".housing").style('opacity', 1);
        svg.selectAll(".felony").style('opacity', 1);
    }
}

function highlightBoroughLine(x) {
    console.log(x);
    plotTextElement.innerHTML = plotText[x];
    x = x.replace(" ","-");
    svg.selectAll(".housing").style('opacity', 0.15);
    svg.selectAll(".felony").style('opacity', 0.15);
    svg.select(".housing#housing-"+x).style('opacity', 1);
    svg.select(".felony#felony-"+x).style('opacity', 1);
}

function setMode(x) {
    mode = x;
};

// Draw the line graph in slide panel
d3.csv("data/NYCHousing&Felony.csv", function(error, data) {


        var $slideContainer = $(".slideContainer"),
            width = $slideContainer.width();
            height = $slideContainer.height();
            console.log('height is: '+height)
        var padding = 0.20 * width;

          
        svg = d3.select(".slideContainer")
            .append("svg")
            .attr('class','svg')
            .attr("width", width)
            .attr("height", 0.75*height)
            .attr('viewBox','0 0 '+ (width)+' '+ (height))
            .attr('preserveAspectRatio','xMinYMin meet')

        var parseDate = d3.time.format("%d-%b-%y").parse;
        var x = d3.time.scale().domain([1990, 2007]).range([padding, width +47]);
        var y0 = d3.scale.linear().domain([0, 650]).range([0.85*height, 0.15*height]);
        var y1 = d3.scale.linear().domain([0, 750]).range([0.85*height, 0.15*height]);

        // Add the X & Y Axis
        var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(7).tickValues(x.domain()).tickFormat(d3.format('.0f'));

        var yAxisLeft = d3.svg.axis().scale(y0).orient("left").ticks(5);
        var yAxisRight = d3.svg.axis().scale(y1).orient("right").ticks(5); 
        var ordinal = d3.scale.ordinal()
                      .domain(["Staten Island", "Queens", "Brooklyn", "Manhattan", "Bronx"])
                      .range([ "#FA9D00", "#000000", "#B00051", "#91278F", "#006884"]);

        svg.append("g")            
            .attr("class", "x axis")
            .attr("transform", "translate(0," + (0.85*height) + ")")
            .call(xAxis);

        svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + (padding) + " ,"+0+")")   
            .style("fill", "steelblue")
            .call(yAxisLeft);   

        svg.append("g")             
            .attr("class", "y axis")    
            .attr("transform", "translate(" + (width+45)  + " ,"+0+")") 
            .style("fill", "red")       
            .call(yAxisRight);

        svg.append("text")
            .attr("x", width*0.1) 
            .attr("y", (0.92*height))
            .style("fill", "steelblue")
            .attr("font-size", "0.75em")
            .text("Housing Rent (1,000 USD)");

        svg.append("text")
            .attr("x", 0.94*width)
            .attr("y", (0.92*height))
            .style("fill", "red")
            .attr("font-size", "0.75em")
            .attr("fill","black")
            .text("Felony (1,000 Cases)");

        var group = svg.append("g")
                      .attr("class", "legendOrdinal")
                      .attr("transform", "translate("+0.3*width+","+0.95*height+")");

                    var legendOrdinal = d3.legend.color()
                      .shape("path", d3.svg.symbol().type("circle").size(150)())
                      .shapePadding(0.17*width)
                      .orient('horizontal')
                      .scale(ordinal);

                    group.selectAll('path')
                         .attr('stroke','#000')
                         .attr('stroke-width',1)
                    svg.select(".legendOrdinal")
                      .call(legendOrdinal);
                    
                    svg.append("text")
                        .attr("transform", "translate(" + (width*0.4) + "," + 0.17*height+ ")")
                        .attr("dy", ".35em")
                        .attr("text-anchor", "start")
                        .style("fill", "black")
                        .text("Continuous line - Housing");
                    
                    svg.append("text")
                        .attr("transform", "translate(" + (width*0.4) + "," + 0.2*height + ")")
                        .attr("dy", ".35em")
                        .attr("text-anchor", "start")
                        .style("fill", "black")
                        .text("Dotted line - Crime");
 

        // draw line of housing rate
        // Bronx
        var valueline_housing_Bronx = d3.svg.line()
            .x(function(d) { return x(d.date); })
            .y(function(d) { return y0(d.Bronx_housing); });
        // Brooklyn
        var valueline_housing_Brooklyn = d3.svg.line()
            .x(function(d) { return x(d.date); })
            .y(function(d) { return y0(d.Brooklyn_housing); });
        // Manhattan
        var valueline_housing_Manhattan = d3.svg.line()
            .x(function(d) { return x(d.date); })
            .y(function(d) { return y0(d.Manhattan_housing); });
        // Queens
        var valueline_housing_Queens = d3.svg.line()
            .x(function(d) { return x(d.date); })
            .y(function(d) { return y0(d.Queens_housing); });
        // Staten
        var valueline_housing_Staten = d3.svg.line()
            .x(function(d) { return x(d.date); })
            .y(function(d) { return y0(d.Staten_housing); });

       

        // draw line of felony rate
        // Bronx
        var valueline_felony_Bronx = d3.svg.line()
            .x(function(d) { return x(d.date); })
            .y(function(d) { return y1(d.Bronx_felony); });
        // Brooklyn
        var valueline_felony_Brooklyn = d3.svg.line()
            .x(function(d) { return x(d.date); })
            .y(function(d) { return y1(d.Brooklyn_felony); });
        // Manhattan
        var valueline_felony_Manhattan = d3.svg.line()
            .x(function(d) { return x(d.date); })
            .y(function(d) { return y1(d.Manhattan_felony); });
        // Queens
        var valueline_felony_Queens = d3.svg.line()
            .x(function(d) { return x(d.date); })
            .y(function(d) { return y1(d.Queens_felony); });
        // Staten
        var valueline_felony_Staten = d3.svg.line()
            .x(function(d) { return x(d.date); })
            .y(function(d) { return y1(d.Staten_felony); });
            //here
        var colorCodes = {
            'Bronx' : "#006884",
            'Brooklyn' : "#B00051",
            'Manhattan' : "#91278F",
            'Queens' : "#000000",
            'Staten' : "#FA9D00"
        }

        //add path for housing rate
        svg.append("path")       
            .style("stroke", colorCodes['Bronx'])
            .attr("class","housing")
            .attr("id","housing-Bronx")
            .attr("d", valueline_housing_Bronx(data));

        svg.append("path")      
            .style("stroke", colorCodes['Brooklyn'])
            .attr("class","housing")
            .attr("id","housing-Brooklyn")
            .attr("d", valueline_housing_Brooklyn(data));

        svg.append("path")       
            .style("stroke", colorCodes['Manhattan'])
            .attr("class","housing")
            .attr("id","housing-Manhattan")
            .attr("d", valueline_housing_Manhattan(data));

        svg.append("path")        
            .style("stroke", colorCodes['Queens'])
            .attr("class","housing")
            .attr("id","housing-Queens")
            .attr("d", valueline_housing_Queens(data));

        svg.append("path")       
            .style("stroke", colorCodes['Staten'])
            .attr("class","housing")
            .attr("id","housing-Staten-Island")
            .attr("d", valueline_housing_Staten(data));
        
        // add path for felony
        svg.append("path")        
            .style("stroke", colorCodes['Bronx'])
            .attr("class","felony")
            .attr("id","felony-Bronx")
            .style("stroke-dasharray", ("6, 6"))
            .attr("d", valueline_felony_Bronx(data));

        svg.append("path")        
            .style("stroke", colorCodes['Brooklyn'])
            .attr("class","felony")
            .attr("id","felony-Brooklyn")
            .style("stroke-dasharray", ("6, 6"))
            .attr("d", valueline_felony_Brooklyn(data));

        svg.append("path")        
            .style("stroke", colorCodes['Manhattan'])
            .attr("class","felony")
            .attr("id","felony-Manhattan")
            .style("stroke-dasharray", ("6, 6"))
            .attr("d", valueline_felony_Manhattan(data));

        svg.append("path")        
            .style("stroke", colorCodes['Queens'])
            .attr("class","felony")
            .attr("id","felony-Queens")
            .style("stroke-dasharray", ("6, 6"))
            .attr("d", valueline_felony_Queens(data));

        svg.append("path")        
            .style("stroke", colorCodes['Staten'])
            .attr("class","felony")
            .attr("id","felony-Staten-Island")
            .style("stroke-dasharray", ("6, 6"))
            .attr("d", valueline_felony_Staten(data));

});
