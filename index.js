let dataStore=[];
let svg;

function fetchData(){
	const urlSensor="data/sensorMini.csv";
	const urlPoints="data/points.csv"
	let sensorData=fetch(urlSensor).then((resp) => resp.text());
	let pointData=fetch(urlPoints).then((resp) => resp.json());
	Promise.all([sensorData,pointData]).then(function(values){
		if (values[0]&&values[1]) {
			initializeViz(values)
		}
		else {
			throw new Error("error fetching data!");
		}
	});
}
	


function initializeViz(data){
	let parsedRoutes=parse(data[0]);
  dataStore.push(parsedRoutes);
  dataStore.push(data[1]);
	const h=982;
	const w=982;
  const padding=30;

  let div = d3.select("#viz").append("div")	
    .attr("class", "tooltip")				
    .style("opacity", 0);
	
	svg = d3.select("#viz") //tiene la selezione per poterlo riusare dopo
        .append("svg")
        .attr("class", "svg-container")
 				.attr("width", w)
 				.attr("height", h);

 	let nodes=svg.selectAll("circle")
		.data(data[1]);

	nodes.enter()
		.append("circle")
		.attr("stroke", "black")
		.attr("r", 5)
		.on("mouseover", function(d) {		
        div.transition()		
        .duration(200)		
        .style("opacity", .9);		
     		div .html(d.type +" "+d.value)
     		.style("left", (d3.event.pageX) + "px")		
         .style("top", (d3.event.pageY - 28) + "px");		
          })					
        .on("mouseout", function(d) {		
            div.transition()		
                .duration(500)		
                .style("opacity", 0);	
        });

	svg.selectAll("circle")
	.attr("cx", function(d,i){
		return d.coord[0];
	})
	.attr("cy", function(d,i){
		return d.coord[1];
	})
	.attr("fill", function(d){
		if(d.type==='ranger-stop'){
			return ("yellow");
		}
		else if (d.type==='entrance'){
			return ("green");
		}
		else if(d.type==='general-gate'){
			return("cyan");
		}
		else if(d.type==='gate'){
			return("red");
		}
		else if(d.type==='camping'){
			return ("orange");
		}
		else if(d.type==='ranger-base'){
			return ("purple");
		}
	});
}


function getPointCoords(data){
	return[];
}

function parse(data){
	let splitted=data.split(/,|\r\n/);
	let cloned=[];
  for (i = 0; i < splitted.length; i=i+4) {
    cloned.push(splitted.slice(i, i+4));
  }
 	return(cloned);
}	


function vehicleFilter(){
	let e = document.getElementById("vehicleTypeList");
	let type = e.options[e.selectedIndex].value;
	let onlyVehicleType=dataStore[0].filter(element => element[2]===type);
	let sortedVehicles=onlyVehicleType.sort(function(a,b){ //ordina l'array in base all'id del veicolo
		if (a[1] < b[1]) {
    	return -1;
  	}
  	if (a[1] > b[1]) {
    	return 1;
  	}
  	return 0;
		});

	let arrayPath=[];
	let singlePath=new Object();
	singlePath.vehicleId=sortedVehicles[0][1];
	singlePath.vehicleType=sortedVehicles[0][2];
	singlePath.path=[];
	let timeStamp=new Object();
	timeStamp.time=sortedVehicles[0][0];
	timeStamp.path=sortedVehicles[0][3];
	singlePath.path.push(timeStamp);
	for (var i=1; i<sortedVehicles.length;i++){
		if (sortedVehicles[i][1]!==sortedVehicles[i-1][1] || (singlePath.path.length>1&&((sortedVehicles[i][3].startsWith('entrance')&&sortedVehicles[i-1][3].startsWith('entrance'))))){ //condizioni di terminazione: il veicolo seguente ha targa diversa oppure c'è un path di lunghezza >2 con due ingressi consecutivi
			arrayPath.push(singlePath);
			singlePath=new Object();
			singlePath.path=[];
			singlePath.vehicleId=sortedVehicles[i][1];
			singlePath.vehicleType=sortedVehicles[i][2];
		}
		timeStamp=new Object();
		timeStamp.time=sortedVehicles[i][0];
		timeStamp.path=sortedVehicles[i][3];
		singlePath.path.push(timeStamp);
		if (i===sortedVehicles.length-1){
			arrayPath.push(singlePath);
		}
	}

	drawPath(arrayPath);
}

function drawPath(data){
	
	//let svg = d3.select("#viz");

	let edges=svg.selectAll("polyline")
		.data(data);

	edges.enter()
		.append("polyline")
		.attr("fill", "none")
		.attr("stroke", "black")
    .attr("stroke-width", 2)
    
    .attr("points", function(d, i){
    let start=[];
    for (let i=0; i<d.path.length; i++){
    	start.push(getCoord(d.path[i].path));
    }
    let result="";
    for(let i=0; i<start.length; i++){
    	result+=start[i].join(",")+" ";
    }
    console.log(result);
    return result;
    });

  edges.exit().remove();
    
}

function transformInPolyPath(data){

}

function getCoord(pointToFind){ //cerca in dataStore[1] le coord di data.path
	let onlySearchedPoint=dataStore[1].filter(element => element.fullname===pointToFind);
	return(onlySearchedPoint[0].coord);
}

/*  
problema: individuare dei pattern insoliti in un dataset di spostamenti

suddivisibile in:
1 ottenere dalla mappa un insieme di punti (coordinate e tipo) usabili come base per la visualizzazione
2 leggere i dati relativi agli spostamenti e mapparli ai punti
		-inserire dei filtri sui veicoli(tutti o ranger, n di assi) e raggruppamenti (spostamenti in un giorno, settimana, mese)
3 aggiungere delle visualizzazioni semplici (barcharts) relativi alle stats delle selezioni precedenti





*/