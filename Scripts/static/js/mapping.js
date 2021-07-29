// Add console.log to check to see if our code is working.
//console.log("working");

// Data sources
const cells_plg = "../../../Resources/cells_map.geojson"
const cells_oz = "../../../Resources/cells_oz.json"
const blocks_oz = "../../../Resources/blocks_oz.json"

// Create the dropdown list
function monthDropDownList(){
	d3.json(cells_oz).then((data)=>{
		//-------------------------------------
	    //Create dropdown list
		let months = Object.keys(data)
		//Create project months list for line chart xaxis
		let monthsList = []
		let monthDropDown = d3.select("#select-month")
		for (m=0;m<months.length;m++){
			let date = new Date(parseInt(months[m]))
			let month = (date.getUTCMonth()+1).toString()
			let year = date.getUTCFullYear().toString()
			let paddedMonth = month.length > 1 ? month : `0${month}`
			let formattedDate = year + '-' + paddedMonth
			// let day = date.getUTCDate()
			// let formattedDate = dateFns.format(new Date(year, month, day), 'MM/dd/yyyy')
			monthsList.push(formattedDate)
			monthDropDown.append('option')
				.text(formattedDate)
				.property('value',months[m])
		}
		//---------------------------------------
		//Create monthly production line chart
		let mProduction = Object.values(data)
		//Creating monthly production for yaxis
		let monthlyOzs = [];
		let cumMontlyOzs = [];
		cumSumMonth = 0;
		for (m=0;m<monthsList.length;m++){
			production = Object.values(mProduction[m])
			sumMonth = production.reduce((a,b)=>a+b,0)
			cumSumMonth += sumMonth
			monthlyOzs.push(sumMonth)
			cumMontlyOzs.push(cumSumMonth)
		}
		//console.log(monthlyOzs)
		let traceMonthly = {
			x:monthsList,
			y:monthlyOzs,
			type:"scatter",
			name:"Monthly Production"
		};
		let traceCumMonthly = {
			x:monthsList,
			y:cumMontlyOzs,
			type:"scatter",
			name: "Cumulative Monthly Production",
			yaxis: 'y2'
		};
		let chartdata = [traceMonthly,traceCumMonthly];
		let layout = {
			title:"Monthly Gold Production",
			xaxis:{
				title:"Months"
			},
			yaxis:{
				title:"Ounces"
			},
			yaxis2: {
				title: 'Cumulative Ounces',
				overlaying: 'y',
				side: 'right'
			  }
		};
		Plotly.newPlot("line-monthly",chartdata,layout)
	})}


//This function will be triggered when a month was chosen from months dropdown list.
function monthSelect(m){
	//console.log(m + ` has been chosen`);
	d3.json(cells_oz).then((data)=>{
		let mData = data[m]
		//console.log(mData)
		//console.log(layers)
		Object.values(mData).forEach((cell,i)=>{
			//Use cell data to decide if cell layer need to be changed!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
			let targetLayer = layers['Overall Pad'][i+1]
			//console.log(targetLayer)
			targetLayer.setStyle(
				//{fillColor: 'violet',
				//fillOpacity: cell/100}
				monthStyle(cell)
			)
		})
	})
}

// -----------------CREATE MAP--------------------------------------------------
const mapCenter=[65.018, -147.36]//the center of the pad
const zoomLevel=15
const mapID='mapid'

// Create the tile layer that will be the background of our map.
let satelliteStreets = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v11/tiles/{z}/{x}/{y}?access_token={accessToken}', 
		{
			attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery (c) <a href="https://www.mapbox.com/">Mapbox</a>',
			maxZoom: 18,
			accessToken: API_KEY
		});


// Create the map object with center, zoom level and default layer.
let map = L.map(mapID, {
	center: mapCenter,
	zoom: zoomLevel,
	layers: [satelliteStreets]
});

// Create baselayer
let baseMaps = {
	"Satellite Streets": satelliteStreets
}

//Add overallPad as new layer
let overallPad = new L.layerGroup()


let layers = {};


let baseStyle = {
    color:"black",
    fillColor:"gold",
    weight:1
}

let testStyle = {
    color:"black",
    fillColor:"red",
    weight:1
}

function monthStyle(cell){
	let monthStyle = {
			fillOpacity: cell/100	
			}
	return monthStyle
}


// Initial plot of cells on the pad
var promises = [d3.json(cells_plg),d3.json(cells_oz)]
Promise.all(promises).then((dataAll)=>{
	let cells_plg = dataAll[0]
	// Create overall look of the pad
	let liftList = []
	L.geoJSON(cells_plg,{
		onEachFeature:function(feature,layer){
			//console.log(feature)
			// check if this lift is in the lift list, if not add this lift to the lift list
			let lift = feature.properties.lift;
			if (liftList.includes(lift)==false){
				liftList.push(lift)
			}

			layer.bindPopup("<h2>Area Name: " + feature.properties.cell + "</h2><hr><h3>Lift: " + feature.properties.lift + "</h3>");
			layer.on({
				// mouseover:function(event){
				// 	layer=event.target;
				// 	layer.setStyle({
				// 		fillOpacity:0.8
				// 	})
				// },
				// mouseout:function(event){
				// 	layer=event.target;
				// 	layer.setStyle({
				// 		fillOpacity:0.3
				// 	})
				// },
				click:function(event){
					layer = event.target;
					map.fitBounds(layer.getBounds());
				  },
			});

			layers['Overall Pad'][feature.properties.cell] = layer;
		},
		style: baseStyle
	}).addTo(overallPad)
	overallPad.addTo(map)
	// console.log(liftList)
	// Create layers for each lift(What's the best way of doing this???)
	liftList.forEach(lift =>{
		//create a new layer
		let liftlayer = new L.layerGroup()
		layers[lift] = liftlayer//right?????????????????????
		L.geoJSON(cells_plg,{
			onEachFeature:function(feature,layer){
				//console.log(feature)
				if (feature.properties.lift == lift){
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
					layers[lift][feature.properties.cell] = layer;
				}
			},
			style: testStyle
		}).addTo(liftlayer)
		//liftlayer.addTo(map)
		
	 })
	//console.log(layers)
	//layers[1].setStyle({ color: 'red' })
})
//console.log(overallPad)

layers['Overall Pad'] = overallPad
//layers['First Lift'] = layers[1]
console.log(layers)
L.control.layers(baseMaps,layers).addTo(map);

//------------------------------------------------------------------Create charts on the right





// Initial Page
function init(){
	monthDropDownList()
}

init()