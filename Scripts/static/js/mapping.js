// Add console.log to check to see if our code is working.
console.log("working");

const mapCenter=[65.018, -147.36]//the center of the pad
const zoomLevel=15
const mapID='mapid'

// We create the tile layer that will be the background of our map.
// We create the second tile layer that will be the background of our map.
let satelliteStreets = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v11/tiles/{z}/{x}/{y}?access_token={accessToken}', 
		{
			attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery (c) <a href="https://www.mapbox.com/">Mapbox</a>',
			maxZoom: 18,
			accessToken: API_KEY
		});

let baseMaps = {
	"Satellite Streets": satelliteStreets
}

// Create the map object with center, zoom level and default layer.
let map = L.map(mapID, {
	center: mapCenter,
	zoom: zoomLevel,
	layers: [satelliteStreets]
});

L.control.layers(baseMaps).addTo(map);