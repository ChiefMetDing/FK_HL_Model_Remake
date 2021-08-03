// Add console.log to check to see if our code is working.
//console.log("working");

// Data sources
const cells_plg = "../../../Resources/cells_map.geojson"
const cells_oz = "../../../Resources/cells_oz.json"
const blocks_oz = "../../../Resources/blocks_oz.json"
const actual_monthly_oz = "../../../Resources/actual_monthly_oz.json"
const latlng_oz = "../../../Resources/latlng_oz.json"
const position_remain_oz = "../../../Resources/position_remain_oz.geojson"

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
};
//Add overallPad as new layer
let overallPad = new L.layerGroup();
let layers = {'Overall Pad': {}};
//let blocksPad = new L.layerGroup();
let blockLayers = {'Blocks':{}}
let baseStyle = {
    color:"black",
    fillColor:"gold",
    weight:1
};
let testStyle = {
    color:"black",
    fillColor:"red",
    weight:1
};
function monthStyle(cell){
	let monthStyle = {
			fillOpacity: cell/100	
			}
	return monthStyle
}
// Initial plot of cells on the pad

let map = L.map(mapID, {
	center: mapCenter,
	zoom: zoomLevel,
	layers: [satelliteStreets
		//, ...Object.values(layers)
	]
});

function padPlot(){
	var promises = [d3.json(cells_plg),d3.json(cells_oz)]
	Promise.all(promises).then((dataAll)=>{
		//read blocks location ounces
		// d3.json(latlng_oz).then((data)=>{
		// 	let lat = data['lat']
		// 	let lng = data['lng']
		// 	let ozs = data['overall_ozs']
		// 	let max_ozs = Math.max(...Object.values(ozs))
		// 	//console.log(max_ozs)
		// 	let lat_int = 0.00013000/2;
		// 	let lng_int = 0.00039999/2;
		// 	Object.keys(lat).forEach(row => {
		// 		L.polygon([
		// 			[lat[row] + lat_int, lng[row] + lng_int],
		// 			[lat[row] - lat_int, lng[row] + lng_int],
		// 			[lat[row] - lat_int, lng[row] - lng_int],
		// 			[lat[row] + lat_int, lng[row] - lng_int]
		// 		], 
		// 		{
		// 			color: 'nan', 
		// 			fillColor: '#f03', 
		// 			fillOpacity:ozs[row]/max_ozs
		// 		}).addTo(map)
		// 	})
		// })
		// d3.json(position_remain_oz).then(data=>{
		// 	let positionData = data.features;
		// 	positionData.forEach(p=>{
		// 		let latlng = p.geometry.coordinates[0];
		// 		let dateInfo = p.properties['2031-05'];
		// 		L.polygon([
		// 			latlng[0],
		// 			latlng[1],
		// 			latlng[2],
		// 			latlng[3]
		// 		],
		// 		{
		// 			color:'nan',
		// 			fillColor:'red',
		// 			fillOpacity:dateInfo/100
		// 		}).addTo(map);
		// 	})
		// })
		

		let cells_plg = dataAll[0];
		// Create overall look of the pad
		let liftList = [];
		L.geoJSON(cells_plg,{
			onEachFeature:function(feature,layer){
				let lift = feature.properties.lift;
				// check if this lift is in the lift list, if not add this lift to the lift list
				if (liftList.includes(lift)==false){
					liftList.push(lift)
				};
				layer.bindPopup("<h2>Area Name: " + feature.properties.cell + "</h2><hr><h3>Lift: " + feature.properties.lift + "</h3>");
				layer.on({
					click:function(event){
						layer = event.target;
						map.fitBounds(layer.getBounds());
					},
				});
				layers['Overall Pad'][feature.properties.cell] = layer; // don't understand this line.
				//console.log(layer)
			},
			style: baseStyle
			
		}).addTo(overallPad);
		// overallPad.addTo(map)
		//console.log(layers['Overall Pad'])
		// Create layers for each lift(What's the best way of doing this???)
		liftList.forEach(lift =>{
			//create a new layer
			let liftlayer = new L.layerGroup();
			layers[lift] = liftlayer;

			let copy = Object.assign({}, cells_plg);
			copy['features'] = copy['features'].filter(d => d.properties.lift == lift);
			L.geoJSON(copy,{
				onEachFeature:function(feature,layer){
					//console.log(feature)
					if (feature.properties.lift == lift) {
						layer.bindPopup("<h2>Area Name: " + feature.properties.cell + "</h2><hr><h3>Lift: " + feature.properties.lift + "</h3>");
						layer.on({
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
		layers['Overall Pad'] = overallPad
		//layers['First Lift'] = layers[1]
		// Create the map object with center, zoom level and default layer.
		// let map = L.map(mapID, {
		// 	center: mapCenter,
		// 	zoom: zoomLevel,
		// 	layers: [satelliteStreets
		// 		//, ...Object.values(layers)
		// 	]
		// });
		//console.log(layers['Overall Pad'])
		
		L.control.layers(layers).addTo(map);
	})
	//console.log(overallPad)
	}
//-------------------------------------------------Create charts on the right

// Initial Page
function init(){
	monthDropDownList();
	padPlot()
	position_gold('2019-01',map,0)
}

init()

let selectDate = '';//for later date selection on line chart

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
		//let monthDropDown = d3.select("#select-month")
		for (m=0;m<months.length;m++){
			let date = new Date(parseInt(months[m]))
			let month = (date.getUTCMonth()+1).toString()
			let year = date.getUTCFullYear().toString()
			let paddedMonth = month.length > 1 ? month : `0${month}`
			let formattedDate = year + '-' + paddedMonth
			// let day = date.getUTCDate()
			// let formattedDate = dateFns.format(new Date(year, month, day), 'MM/dd/yyyy')
			monthsList.push(formattedDate)
			// monthDropDown.append('option')
			// 	.text(formattedDate)
			// 	.property('value',months[m])
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
		myPlot.on('plotly_click', testFunc);
	})}
function testFunc(data) {
	selectDate = data.points[0].x.slice(0,7)
	position_gold(selectDate,map,1)
}
function play(){
	position_gold(selectDate,map,2)
}
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
let blocksPad = new L.layerGroup();
// Gold remaining by position and date
function position_gold(date,map,trigger){
	d3.json(position_remain_oz).then(data=>{
		let positionData = data.features
		//trigger will be 0,1,2
			//0 is initial setup
			//1 is single click on the line chart
			//2 is time lapse play
		
		if (trigger == 0) {
			positionData.forEach((p,index)=>{
				let latlng = p.geometry.coordinates[0];
				//let dateInfo = p.properties[date];
				let thisBlock = L.polygon([
					latlng[0],
					latlng[1],
					latlng[2],
					latlng[3]
				],
				{
					color:'nan',
					fillColor:'yellow',
					fillOpacity:0
				})
				thisBlock.addTo(blocksPad);
				blockLayers['Blocks'][index] = thisBlock
			})
			//blockLayers['Blocks'] = blocksPad
			blocksPad.addTo(map)
			// map.removeLayer(blocksPad)
			// blocksPad.addTo(map)
		}
		else if (trigger == 1){
			positionData.forEach((p,index)=>{
				let dateInfo = p.properties[date];
				let targetP = blockLayers['Blocks'][index]
				targetP.setStyle(
					{
						fillOpacity:dateInfo/200
					}
				)
			})
		}
		else if (trigger == 2){
			let timeLine = Object.keys(positionData[0]['properties'])
			timeLine.forEach((date,mindex)=>{
				//---------
				//close eyes and count 1,2,3
				//---------
				positionData.forEach((p,pindex)=>{
					let dateInfo = p.properties[date];
					let targetP = blockLayers['Blocks'][pindex]
					targetP.setStyle(
						{
							fillOpacity:dateInfo/200
						}
					)
				})
			})
			//console.log("fine")
			//console.log(Object.keys(positionData[0]['properties']))

		}
	})

}
