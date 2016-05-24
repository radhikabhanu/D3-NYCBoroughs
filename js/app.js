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
    "Bronx": 4
};

var currentBorough = 0;

var text;

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

$(document).ready(
        function() {
            getApiKey();
            text = document.getElementById("text");
            map = L.map('map', { zoomControl:false }).setView([40.7127, -74.0059], 10);

            L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
                attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
                minZoom: 10,
                maxZoom: 12,
                id: ['radhikabk.065mp68i'],
                accessToken: ['pk.eyJ1IjoicmFkaGlrYWJrIiwiYSI6ImNpb2Y0bTdxOTAwdWh5dm0yc250a2s4MG4ifQ.OXohB9JMXN_liaBsgWaZ6Q']
            }).addTo(map);


            geojsonLayer = L.geoJson().addTo(map);

            L.Util.setOptions(geojsonLayer,
                {
                style: {
                    "clickable": true,
                    "color": "#ff7800",
                    "weight": 2,
                    "opacity": 0.65
                },

                onEachFeature: function (feature, layer) {
                    layer.on('click', function (e) {
                        var popup = "<h4>" + feature.properties.NAME + "</h4>";
                        variables.forEach(function(v) {
                            popup += "<br/><strong>" + v + "</strong>: " + feature.properties[v];
                        });

                        layer.bindPopup(popup);
                    });
                }

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
    text.innerHTML = x;
    if( $('#navbar-header').hasClass('in') ) {
        $('.navbar-toggler').click();
    }
    clearMap();
    currentBorough = boroughs[x];

    geojsonLayer.addData(NYCgeojson.features[currentBorough]);
    var bounds = geojsonLayer.getBounds();
    var center = bounds.getCenter();
    map.panTo(center)
};

function setMode(x) {
    mode = x;
};

// Draw the line graph in slide panel
d3.csv("NYSummary2.csv", function(error, data) {


        var $slideContainer = $(".slideContainer"),
            width = $slideContainer.width();
            height = $slideContainer.height();

        var padding = 0.12 * width;
          
        var svg = d3.select(".slideContainer")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr('viewBox','0 0 '+ (width)+' '+ (height))
            .attr('preserveAspectRatio','xMinYMin meet')

        var parseDate = d3.time.format("%d-%b-%y").parse;

        var x = d3.scale.linear().domain([1990, 2007]).range([padding, width - padding]);
        var y0 = d3.scale.linear().domain([0, 650]).range([height - padding, padding]);
        var y1 = d3.scale.linear().domain([0, 750]).range([height - padding, padding]);

        // Add the X & Y Axis
        var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(7);
        var yAxisLeft = d3.svg.axis().scale(y0).orient("left").ticks(5);
        var yAxisRight = d3.svg.axis().scale(y1).orient("right").ticks(5); 

        svg.append("g")            
            .attr("class", "x axis")
            .attr("transform", "translate(0," + (height - padding) + ")")
            .call(xAxis);

        svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + (padding) + " ,0)")   
            .style("fill", "steelblue")
            .call(yAxisLeft);   

        svg.append("g")             
            .attr("class", "y axis")    
            .attr("transform", "translate(" + (width - padding) + " ,0)")   
            .style("fill", "red")       
            .call(yAxisRight);

        svg.append("text")
            .attr("x", - (height)/ 2 - padding) 
            .attr("y", padding / 4)
            .style("fill", "steelblue")
            .attr("transform", "rotate(-90)")
            .text("Housing Rent (1,000 USD)");

        svg.append("text")
            .attr("x", - (height)/ 2 - padding)
            .attr("y", (width - padding / 4))
            .attr("transform", "rotate(-90)")
            .style("fill", "red") 
            .text("Felony (1,000 Cases)");

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

        // add path for housing

        var lineOpacity = 0.2;
        var lineColorHousing = "#ff0000";
        var lineColorFelony = "#0040ff";

        svg.append("path")        // Add the valueline2 path.
            .style("stroke", lineColorHousing)
            .style("opacity", lineOpacity)
            .attr("d", valueline_housing_Bronx(data));

        svg.append("path")        // Add the valueline path.
            .style("stroke", lineColorHousing)
            .style("opacity", lineOpacity)
            .attr("d", valueline_housing_Brooklyn(data));

        svg.append("path")        // Add the valueline2 path.
            .style("stroke", lineColorHousing)
            .style("opacity", lineOpacity)
            .attr("d", valueline_housing_Manhattan(data));

        svg.append("path")        // Add the valueline path.
            .style("stroke", lineColorHousing)
            .style("opacity", lineOpacity)
            .attr("d", valueline_housing_Queens(data));

        svg.append("path")        // Add the valueline2 path.
            .style("stroke", lineColorHousing)
            .style("opacity", lineOpacity)
            .attr("d", valueline_housing_Staten(data));

        // add path for falony
        svg.append("path")        // Add the valueline2 path.
            .style("stroke", lineColorFelony)
            .style("opacity", lineOpacity)
            .attr("d", valueline_felony_Bronx(data));

        svg.append("path")        // Add the valueline path.
            .style("stroke", lineColorFelony)
            .style("opacity", lineOpacity)
            .attr("d", valueline_felony_Brooklyn(data));

        svg.append("path")        // Add the valueline2 path.
            .style("stroke", lineColorFelony)
            .style("opacity", lineOpacity)
            .attr("d", valueline_felony_Manhattan(data));

        svg.append("path")        // Add the valueline path.
            .style("stroke", lineColorFelony)
            .style("opacity", lineOpacity)
            .attr("d", valueline_felony_Queens(data));

        svg.append("path")        // Add the valueline2 path.
            .style("stroke", lineColorFelony)
            .style("opacity", lineOpacity)
            .attr("d", valueline_felony_Staten(data));

});
