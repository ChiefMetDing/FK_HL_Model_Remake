// Add console.log to check to see if our code is working.
console.log("working");

// Data sources
const cells_plg = "../../../Resources/cells_map.geojson"
const cells_oz = "../../../Resources/cells_oz.json"
let layers = {};

// Create the dropdown list
d3.json(cells_oz).then((data)=>{
	let months = Object.keys(data)
	//console.log(months)
	//Create project months list
	//let monthsList = []
	let monthDropDown = d3.select("#select-month")
	for (m=0;m<months.length;m++){
		let date = new Date(parseInt(months[m]))
		let month = (date.getUTCMonth()+1).toString()
		let year = date.getUTCFullYear().toString()
		let paddedMonth = month.length > 1 ? month : `0${month}`
		let formattedDate = year + '-' + paddedMonth
		// let day = date.getUTCDate()
		// let formattedDate = dateFns.format(new Date(year, month, day), 'MM/dd/yyyy')
		//monthsList.push(formattedDate)
		monthDropDown.append('option')
			.text(formattedDate)
			.property('value',months[m])
	}
})


//This function will be triggered when a month was chosen from months dropdown list.
function monthSelect(m){
	console.log(m + ` has been chosen`);
	d3.json(cells_oz).then((data)=>{
		let mData = data[m]
		console.log(mData)
		console.log(layers)
		Object.values(mData).forEach((cell,i)=>{
			let targetLayer = layers[i+1]
			console.log(targetLayer)
			targetLayer.setStyle({
				fillColor: 'violet',
				fillOpacity: cell/100
			})
		})
	})
}



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



let myStyle = {
    color:"black",
    fillColor:"gold",
    weight:1
}


var promises = [d3.json(cells_plg),d3.json(cells_oz)]
Promise.all(promises).then((dataAll)=>{
	// console.log(data)
	
	//Converting all time stamps to dates ------------------------------May not need this step
	let cells_oz = dataAll[1]
	let project_months = Object.keys(cells_oz)
	let projectMonths = []
	for (i=0;i<project_months.length;i++){
		projectMonths.push(Date(project_months[i]))
	}
	//Here is going to be a function triggered by choosing from the dropdown list.
	//Creating cells polygon layer
	let cells_plg = dataAll[0]
	//console.log(cells_plg)
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
			layers[feature.properties.cell] = layer;
		},
		style: myStyle
	}).addTo(map)
	//console.log(layers)
	layers[1].setStyle({ color: 'red' })
})


L.control.layers(baseMaps).addTo(map);