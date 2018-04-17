/*  
problema: individuare dei pattern insoliti in un dataset di spostamenti

suddivisibile in:
1 ottenere dalla mappa un insieme di nodes (coordinate e tipo di luogo) usabili come base per la visualizzazione
2 leggere i dati relativi agli spostamenti e mapparli ai punti
		-inserire dei filtri sui veicoli(tutti o ranger, n di assi) e raggruppamenti (spostamenti in un giorno, settimana, mese)
3 aggiungere delle visualizzazioni semplici relativi alle stats delle selezioni precedenti:
		-grafico di lunghezza dei percorsi
		-nelle tooltip, stats di tipo di veicoli che attraversano quel gate
*/

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
  dataStore.push(data[0]);
  dataStore.push(data[1]);
	const h=982;
	const w=982;
  const padding=30;

  let div = d3.select("#viz").append("div")	
    .attr("class", "tooltip")				
    .style("opacity", 0);
	
	svg = d3.select("#viz") //salva svg in global per poterlo riusare dopo
        .append("svg")
        .attr("class", "svg-container")
 				.attr("width", w)
 				.attr("height", h);

 	let nodes=svg.selectAll("circle")
		.data(data[1]);

	nodes.enter()
		.append("circle")
		.attr("stroke", "black")
		.attr("r", 7)
		.on("mouseover", function(d) {		
      div.transition() //si può fare classe css della transition?		
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

function parse(data){
	let splitted=data.split(/,|\r\n/); //divide a ogni "," o a nuova linea
	let cloned=[];
  for (i = 0; i < splitted.length; i=i+4) { //ricostruisce la row originaria del csv
    cloned.push(splitted.slice(i, i+4));
  }
 	return(cloned);
}	


function vehicleFilter(data){
	let e = document.getElementById("vehicleTypeList");
	let type = e.options[e.selectedIndex].value;
	let onlyVehicleType=data.filter(element => element[2]===type);
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
		if (sortedVehicles[i][1]!==sortedVehicles[i-1][1] || (singlePath.path.length>1&&((sortedVehicles[i][3].startsWith('entrance')&&sortedVehicles[i-1][3].startsWith('entrance'))))){ //ARGH :D condizioni di terminazione: il veicolo seguente ha targa diversa oppure c'è un path di lunghezza >1 con due ingressi consecutivi
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
	console.log(arrayPath);
	return arrayPath;
}

function drawPath(data){
	actualVized=data;
	let div = d3.select("#viz").append("div")	
    .attr("class", "tooltip")				
    .style("opacity", 0);
  //console.log("extracting the path:");
  let start =pathExtractor(data);
	let edges=svg.selectAll("polyline")
		.data(start);

	edges.exit().remove(); //rimuove la selezione precedente
	
	edges.attr("points", function(d, i){ //update: con merge non serve https://stackoverflow.com/questions/20708442/d3-js-chart-not-updated-with-new-data
  	return d;
	});  

	edges.enter()
		.append("polyline")
		.attr("fill", "none")
		.attr("stroke", "black")
    .attr("stroke-width", 0.1)
    //.merge(edges) //senza update nè merge i dati sono aggiunti solo da enter: aggiunge paths se più lunghi, ma non aggiorna quelli esistenti
    .attr("points", function(d, i){
    	return d;
  	})
  	.on("mouseover", function(d, i) {		
  		console.log(d);
  		console.log(i);
      div.transition()
          .duration(200)		
          .style("opacity", .9);		
     	div .html("Path tooltip!!!")
     		  .style("left", (d3.event.pageX) + "px")		
          .style("top", (d3.event.pageY - 28) + "px");		
     })					
    .on("mouseout", function(d) {		
      div.transition()		
         .duration(500)		
         .style("opacity", 0);	
     });  
}

function pathExtractor(data){
	let responce=data.map(function (d){
  	let temp=[];
  	let result="";
  	for (let i=0; i<d.path.length; i++){ //estrae il path
    	temp.push(getCoord(d.path[i].path));
  	}
  	for(let i=0; i<temp.length; i++){ //trasforma in una stringa leggibile da polyline
    	result+=temp[i].join(",")+" ";
  	}
  	return result;
  });
  return responce;
}

function getCoord(pointToFind){ //cerca in dataStore[1] le coord di data.path
	let onlySearchedPoint=dataStore[1].filter(element => element.fullname===pointToFind);
	return(onlySearchedPoint[0].coord);
}

function draw(){
	let parsedRoutes=parse(dataStore[0]); 
	let timeFiltered=timeFilter(parsedRoutes);
	if (timeFiltered.length>0) {
		let pathArray=vehicleFilter(timeFiltered);
		drawPath(pathArray);
	}
	else {
		alert("no data to viz!")
	}
}

function timeFilter(data){
	let m = document.getElementById("monthList");
	let mValue = m.options[m.selectedIndex].value;
	let y = document.getElementById("yearList");
	let yValue = y.options[y.selectedIndex].value;
	let yearFiltered=[];
	let monthFiltered=[];
	if (yValue!=='0') {
		yearFiltered=data.filter(function (d){
			let sliced=d[0].slice(0,4);
			if (sliced===yValue){
				return d;
			}	
		});
	}
	else {
		yearFiltered=data;
	}
	if (mValue!=='0') {
		monthFiltered=yearFiltered.filter(function (d){
			let sliced=d[0].slice(5,7);
			if (sliced===mValue){
				return d;
			}	
		});
	}
	else {
		monthFiltered=yearFiltered;
	}
	return monthFiltered;
}

