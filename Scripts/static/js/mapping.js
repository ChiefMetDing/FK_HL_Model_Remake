// Add console.log to check to see if our code is working.
console.log("working");






// -----------------CREATE MAP--------------------------------------------------
const mapCenter=[65.018, -147.36]//the center of the pad
const zoomLevel=15
const mapID='mapid'

// We create the tile layer that will be the background of our map.
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

const cells_plg = "../../../Resources/cells_map.geojson"
const cells_oz = "../../../Resources/cells_oz.json"

let myStyle = {
    color:"black",
    fillColor:"gold",
    weight:1
}

var promises = [d3.json(cells_plg),d3.json(cells_oz)]
Promise.all(promises).then((dataAll)=>{
	// console.log(data)
	
	//Converting all time stamps to dates
	let cells_oz = dataAll[1]
	let project_months = Object.keys(cells_oz)
	let projectMonths = []
	for (i=0;i<project_months.length;i++){
		projectMonths.push(Date(project_months[i]))
	}
	//Creating cells polygon layer
	let cells_plg = dataAll[0]
	L.geoJSON(cells_plg,{
		onEachFeature:function(feature,layer){
			layer.bindPopup("<h2>Area Name: " + feature.properties.cell + "</h2><hr><h3>Lift: " + feature.properties.lift + "</h3>");
			layer.on({
				mouseover:function(event){
					layer=event.target;
					layer.setStyle({
						fillOpacity:0.8
					})
				},
				mouseout:function(event){
					layer=event.target;
					layer.setStyle({
						fillOpacity:0.3
					})
				},
				click:function(event){
					layer = event.target;
					map.fitBounds(layer.getBounds());
				  },
			});
		},
		style: myStyle
	}).addTo(map)
})


L.control.layers(baseMaps).addTo(map);