// Add console.log to check to see if our code is working.
//console.log("working");

// Data sources
const cells_plg = "../../../Resources/cells_map.geojson"
const cells_oz = "../../../Resources/cells_oz.json"
const blocks_oz = "../../../Resources/blocks_oz.json"
const actual_monthly_oz = "../../../Resources/actual_monthly_oz.json"
const latlng_oz = "../../../Resources/latlng_oz.json"

// -----------------CREATE MAP--------------------------------------------------
const mapCenter = [65.018, -147.36]//the center of the pad
const zoomLevel = 15
const mapID = 'mapid'

// Create the tile layer that will be the background of our map.
let satelliteStreets = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v11/tiles/{z}/{x}/{y}?access_token={accessToken}', 
		{
			attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery (c) <a href="https://www.mapbox.com/">Mapbox</a>',
			maxZoom: 18,
			accessToken: API_KEY
		});


// Create baselayer
let baseMaps = {
	"Satellite Streets": satelliteStreets
}

//Add overallPad as new layer
let overallPad = new L.layerGroup()


let layers = {
	'Overall Pad': {}
};


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
				click:function(event){
					layer = event.target;
					map.fitBounds(layer.getBounds());
				  },
			});
			console.log(layers)

			layers['Overall Pad'][feature.properties.cell] = layer;
		},
		style: baseStyle
	}).addTo(overallPad)
	// overallPad.addTo(map)
	// console.log(liftList)
	// Create layers for each lift(What's the best way of doing this???)
	liftList.forEach(lift =>{
		//create a new layer
		let liftlayer = new L.layerGroup()
		layers[lift] = liftlayer//right?????????????????????

		let copy = Object.assign({}, cells_plg);
		copy['features'] = copy['features'].filter(d => d.properties.lift == lift);
		
		L.geoJSON(copy,{
			onEachFeature:function(feature,layer){
				//console.log(feature)
				if (feature.properties.lift == lift) {
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
		// liftlayer.addTo(map)
		
	 })
	//console.log(layers)
	//layers[1].setStyle({ color: 'red' })
	layers['Overall Pad'] = overallPad
	//layers['First Lift'] = layers[1]

	// Create the map object with center, zoom level and default layer.
	let map = L.map(mapID, {
		center: mapCenter,
		zoom: zoomLevel,
		layers: [satelliteStreets, ...Object.values(layers)]
	});

	L.control.layers(layers).addTo(map);

	
	//read blocks location ounces
	d3.json(latlng_oz).then((data)=>{
		let lat = data['lat']
		let lng = data['lng']
		let ozs = data['overall_ozs']
		let max_ozs = Math.max(...Object.values(ozs))
		//console.log(max_ozs)
		
		let lat_int = 0.00013000;
		let lng_int = 0.00039999;
		Object.keys(lat).forEach(row => {
			L.polygon([
				[lat[row] + lat_int, lng[row] + lng_int],
				[lat[row] - lat_int, lng[row] + lng_int],
				[lat[row] - lat_int, lng[row] - lng_int],
				[lat[row] + lat_int, lng[row] - lng_int]
			], { color: 'red', fillColor: '#f03', fillOpacity:ozs[row]/max_ozs}).addTo(map)
		})

	
		
	})
})
//console.log(overallPad)

//-------------------------------------------------Create charts on the right



// Initial Page
function init(){
	monthDropDownList();
	// plotBlocksOz();
}

init()

// Create the dropdown list
function monthDropDownList(){
	var promises = [d3.json(cells_oz),d3.json(actual_monthly_oz)]
	
	//d3.json(cells_oz).then((data)
	Promise.all(promises).then((dataAll)=>{
		//-------------------------------------
		let modelData = dataAll[0]
		let actualData = dataAll[1]
	    //Create dropdown list
		let months = Object.keys(modelData)
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
		let mProduction = Object.values(modelData)
		//Creating monthly production for yaxis
		let monthlyOzs = [];
		let actMonthlyOzs = Object.values(actualData['ounces']);
		let cumMontlyOzs = [];
		let cumActMonthlyOzs = [];
		let cumSumMonth = 0;
		let cumActSumMonth = 0
		//console.log(actMonthlyOzs)

		for (m=0;m<monthsList.length;m++){
			production = Object.values(mProduction[m])
			sumMonth = production.reduce((a,b)=>a+b,0)
			cumSumMonth += sumMonth
			cumActSumMonth += actMonthlyOzs[m]
			monthlyOzs.push(sumMonth)
			cumMontlyOzs.push(cumSumMonth)
			cumActMonthlyOzs.push(cumActSumMonth)
		}
		//console.log(monthlyOzs)
		//console.log(cumActMonthlyOzs)
		let traceMonthly = {
			x:monthsList,
			y:monthlyOzs,
			type:"scatter",
			name:"Model"
		};
		let traceActMonthly = {
			x:monthsList,
			y:actMonthlyOzs,
			type:"scatter",
			name:"Actual"
		};
		let traceCumMonthly = {
			x:monthsList,
			y:cumMontlyOzs,
			type:"scatter",
			name: "Cumulative Model",
			yaxis: 'y2'
		};
		let traceActCumMonthly = {
			x:monthsList,
			y:cumActMonthlyOzs,
			type:"scatter",
			name: "Cumulative Actual",
			yaxis: 'y2'
		};
		let chartdata = [traceMonthly,traceActMonthly,traceCumMonthly,traceActCumMonthly];
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
		let myPlot = document.getElementById("line-monthly");
		Plotly.newPlot(myPlot,chartdata,layout);
		function testFunc(data) {
			console.log(data.points[0].x)
		}
		myPlot.on('plotly_click', testFunc);
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