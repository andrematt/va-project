/*  

	 //reduce function: d3min, max, sum, extends.. sono fatte trmaite reduce. Es: sommatoria dei valor:
  //sum = aggregated from previous steps
  let initialValue=0;
  let totalPathLength = actualData.reduce(function(sum, d) {return sum+d.path.length}, initialValue);

problema: individuare dei pattern insoliti in un dataset di spostamenti

suddivisibile in:
1 ottenere dalla mappa un insieme di nodes (coordinate e tipo di luogo) usabili come base per la visualizzazione
2 leggere i dati relativi agli spostamenti e mapparli ai punti
		-inserire dei filtri sui veicoli(tutti o ranger, n di assi) e raggruppamenti (spostamenti in un giorno, settimana, mese)
3 aggiungere delle visualizzazioni semplici relativi alle stats delle selezioni precedenti:
		-grafico di lunghezza dei percorsi
		-nelle tooltip, stats sul tipo di veicoli che attraversano quel gate
		-max e min path length per ogni tipo di veicolo
*/

let dataStore=[]; //dati letti da file
let actualData=[]; //dati in uso per la visualizzazione
let mappedCoord=[]; //mapping di coordinate a dimenzioni svg
let svg;
let nodes;
let graphView=true;

function fetchData(){
	const urlSensor="data/sensor.csv";
	const urlPoints="data/points.csv"
	let sensorData=fetch(urlSensor).then((resp) => resp.text());
	let pointData=fetch(urlPoints).then((resp) => resp.json());
	Promise.all([sensorData,pointData]).then(function(values){
		if (values[0]&&values[1]) {
  		dataStore.push(values[0]);
  		dataStore.push(values[1]);
			initializeViz(values)
		}
		else {
			throw new Error("error fetching data!");
		}
	});
}
	
function initializeViz(){
	var h=800;
	var w=800;
  const padding=60;
  d3.select("svg").remove();

  let div = d3.select("#viz").append("div")	
    .attr("class", "tooltip")				
    .style("opacity", 0);
	
	svg = d3.select("#viz") //salva svg in global per poterlo riusare dopo
        .append("svg")
        .attr("class", "svg-container")
 				.attr("width", w)
 				.attr("height", h);

 	let maxX=d3.max(dataStore[1], function(d){return d.coord[0]});
	let minX=d3.min(dataStore[1], function(d){return d.coord[0]});
	let maxY=d3.max(dataStore[1], function(d){return d.coord[1]});
	let minY=d3.min(dataStore[1], function(d){return d.coord[1]});

	let xScale = d3.scaleLinear()
		.domain([minX, maxX])
		.range([0+padding/2, 800-padding/2]);
	let xMap = function (d){return xScale(d.coord[0])};
	let xAxis = d3.axisBottom(xScale);

let yScale = d3.scaleLinear()
	.domain([minY, maxY])
	.range([0+padding/2, 800-padding/2]);
let yMap = function (d){return yScale(d.coord[1])};
let yAxis = d3.axisBottom(yScale);			

	//approfitto delle funzioni xScale e Yscale per salvare le coordinate mappate alle dimenzioni dell'svg, per riusarle dopo per i path
	mappedCoord=dataStore[1].map(function (d){
		let scaledCoord=[];
		let cloned=[];
		scaledCoord[0]=xScale(d.coord[0]);
		scaledCoord[1]=yScale(d.coord[1]);
		let singleObj = {
			"type" : d.type,
			"value": d.value,
			"fullname": d.fullname,
			"coord": scaledCoord,
		};
		return(singleObj);
	});

 	nodes=svg.selectAll("circle")
		.data(dataStore[1]);

	nodes.enter()
		.append("circle")
		.attr("stroke", "black")
		.attr("r", 7)
		.attr("cx", xMap)
    .attr("cy", yMap)
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

function pathLength(){
	let w = 800;
	let h = 400;
	let padding=60;
	
  let groups=d3.nest() //raggruppa i dati per lunghezza del path
  	.key(function(d) {return d.path.length;})
  	.entries(actualData);

	let maxX=d3.max(groups, function(d){return +d.key});
	let minX=d3.min(groups, function(d){return +d.key});
	let maxY=d3.max(groups, function(d){return d.values.length});
	let minY=d3.min(groups, function(d){return d.values.length});

	let xScale = d3.scaleLinear()
		.domain([minX, maxX])
		.range([0+padding/2, w-padding/2]);
	let xMap = function (d){return xScale(d.key)};
	let xAxis = d3.axisBottom(xScale);

	let yScale = d3.scaleLinear()
	.domain([minY, maxY])
	.range([h-padding/2, 0+padding/2]); //inverte asse Y 
	let yMap = function (d){return yScale(d.values.length)};
	let yAxis = d3.axisLeft(yScale)
	 .tickValues(["min", "max"]);  
	console.log(yAxis);
	svg.selectAll(".dot")
		.data(groups)
	  .enter().append("circle")
	  .attr("class", "dot")
		.attr("r", 3.5)
	  .attr("cx", xMap)
	  .attr("cy", yMap)
	    .append("g")
    .attr("transform", "translate(0,30)")
    .call(yAxis);
}

function initializeStatViz(){
	graphView=false;	
	var h=600;
	var w=800;
  const padding=60;
	d3.select("svg").remove();
	$('#stats').remove();
		let main = document.getElementById("viz");
  	var html = '<div id="stats"><button id="pathLenths" onClick="pathLength()">Path lengths</button></stats>';
  	$(main).append(html);

  svg = d3.select("#viz") //salva svg in global per poterlo riusare dopo
     .append("svg")
     .attr("class", "svg-container")
 		 .attr("width", w)
 		 .attr("height", h);
}

function parse(data){
	let splitted=data.split(/,|\n|\r\n/); //divide a ogni "," o a nuova linea. Carriage return diverso per linux e windows
	let cloned=[];
  for (i = 0; i < splitted.length; i=i+4) { //ricostruisce la row originaria del csv
    cloned.push(splitted.slice(i, i+4));
  }
 	return(cloned);
}	


function vehicleFilter(data){
	let e = document.getElementById("vehicleTypeList");
	let type = e.options[e.selectedIndex].value;
	return(data.filter(element => element[2]===type));
}

function sortAndMakePath(data){
	let sortedVehicles=data.sort(function(a,b){ //ordina l'array in base all'id del veicolo
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
	return arrayPath;
}

function drawPath(data){
	let div=d3.select("#viz").append("div")	
    .attr("class", "tooltip")				
    .style("opacity", 0);
  
  let start=pathExtractor(data);

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
    .attr("stroke-width", 0.2)
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

function getCoord(pointToFind){ //cerca tra l'array di coordinate dei punti (mappate alla grandezza dell'svg) quelle di data.path
	let onlySearchedPoint=mappedCoord.filter(element => element.fullname===pointToFind);
	return(onlySearchedPoint[0].coord);
}

function filter(){
	let parsedRoutes=parse(dataStore[0]); 
	let vehicleFiltered=vehicleFilter(parsedRoutes);
	let timeFiltered=timeFilter(vehicleFiltered);
	let paths=sortAndMakePath(timeFiltered);
	let lengthFilteredPaths=lengthFilter(paths);
	actualData=lengthFilteredPaths;
	
}

function drawGraph(){
	 if(!graphView){
  	initializeViz();
  	graphView=true;
  }
	if (actualData.length>0) {
		drawPath(actualData);
	}
	else {
		alert("no data to viz!")
	}
}

function seeStats(){
	 if(graphView){
  	initializeStatViz();
  	graphView=false;
  }
	if (actualData.length>0) {
		
	}
	else {
		alert("no data to viz!")
	}
}

function lengthFilter(data){
  let e = document.getElementById("pathLenghtList");
	let selectedValue = e.options[e.selectedIndex].value;
	if(selectedValue==="0"){
		return data;
	}
	else if (selectedValue==="1") {
		return(data.filter(element => element.path.length<5));
	}
	else if(selectedValue=="2"){
		let result=data.filter(element => element.path.length>5);
		return result.filter(element => element.path.length<15);
	}
		else if(selectedValue=="3"){
		let result=data.filter(element => element.path.length>15);
		return result.filter(element => element.path.length<25);
	}
		else if(selectedValue=="4"){
		let result=data.filter(element => element.path.length>25);
		return result.filter(element => element.path.length<35);
	}
	else {
		return(data.filter(element => element.path.length>35));
	}
}

function timeFilter(data){
	let m = document.getElementById("monthList");
	let mValue = m.options[m.selectedIndex].value;
	let y = document.getElementById("yearList");
	let yValue = y.options[y.selectedIndex].value;
	let d = document.getElementById("dayList");
	let dValue = d.options[d.selectedIndex].value;
	let yearFiltered=[];
	let monthFiltered=[];
	let dayFiltered=[];
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
	if (dValue!=='-1'){ 
		dayFiltered=monthFiltered.filter(function (d){
		let thisDate = new Date(d[0]); //trasforma la stringa in oggetto data
		if ((thisDate.getDay()+"")===dValue){ //prende il giorno della settimana
			return d;
		}
		thisDate=null; //annulla il riferimento all'oggetto, altrimenti il browser crasha http://bertanguven.com/preventing-memory-leaks-in-javascript-null-vs-delete
		});
	}
	else {
		dayFiltered=monthFiltered;
	}
	return dayFiltered;
}

