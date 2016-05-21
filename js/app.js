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