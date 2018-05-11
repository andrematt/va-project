

let dataStore; //dati letti da file
let actualData=[]; //dati in uso per la visualizzazione
let mappedCoord=[]; //mapping di coordinate a dimenzioni svg
let pathData=[]; //array di paths non filtrati per essere usato con crossfitler
let svg;
let viewType=0;  //0 = graph, 1 = path length, 2 = path crossing
const padding=80;
	var h=400; //dimenzioni di default dell'svg, possono cambiare
	var w=400;




function testCallback(){
	const urlDB = 'http://localhost:3000/sensors';
	let allPoints=fetch(urlDB).then((resp) => resp.json());
	allPoints.then(function(value) {
 		console.log(value);
 	});

	/* 	
 	let query = 'http://localhost:3000/sensor/entrance0';
	let singlePoint=fetch(query).then((resp) => resp.json());
	singlePoint.then(function(value) {
 		console.log(value);
 	})
 	*/
}

function pointStats(data){

}

function getPointData(gate){
	let query = 'http://localhost:3000/sensor/'+gate;
	console.log(query);
	let result=[];
	let singlePoint=fetch(query).then((resp) => resp.json());
	singlePoint.then(function(value) {
		value.forEach(function(val){
			result.push(val);
		})
 		pointStats(pathData);
 	  	//var xf = crossfilter(pathData);
	    //console.log(xf.size());	
	    //let test=nameFilter(name, pathData);
	    //console.log(test);
 	});
 	
		//estrai il nome del punto
		//da dataStore estrai tutti gli attraversamenti di quel punto (filtra actualData con quel nome)
		//non da actualData! qua i filtri "normali" vengono disattivati, e lavora crossfilter
		//passa a crossfilter i dati filtrati
		//costruisci raggruppamenti del traffico per giorno/mese/anno
 	
}

function fetchData(){
	const urlPoints="../data/points.csv";
	let pointData=fetch(urlPoints).then((resp) => resp.json());
	pointData.then(function(values){
		if(values){
			dataStore=values;
			initializeViz();
			initializeNodes();
			addOnclick();
		}
		else {
			throw new Error("error fetching data!");
		}
	})
}


function pathStats(data){
	
	let h = 250;
	let w = 600;
	let maxX=d3.max(data, function(d){return d.pathLength});
	let yValues=d3.nest()
  		.key(function(d) { return d.pathLength;})
   		.rollup(function(v) { return v.length; })
		.entries(data);
  	let maxY=d3.max(yValues, function(d){return d.value});
  	let pixPerUnit = h / Math.log(maxY);
   

	let paths  = crossfilter(data);	
	  all = paths.groupAll();
      id = paths.dimension(function(d) { return d.vehicleId; }),
      ids = id.group(),
      path =paths.dimension(function(d) { return d.path; }),
      pathLength = paths.dimension(function(d){ return d.pathLength; }),
      lengths=pathLength.group();
      type = paths.dimension(function(d) { return +d.vehicleType; }),
      types = type.group();
       topTypes = types.top(1);
topTypes[0].key; // the top payment type (e.g., "tab")
topTypes[0].value; // the count of payments of that type (e.g., 8)
    
    let lengthsChart = dc.barChart("#dc-lengths-chart");

    lengthsChart.width(w)
     .height(h)
     .margins({top: 10, right: 10, bottom: 20, left: 40})
     .dimension(pathLength)								// the values across the x axis
     .group(lengths)							// the values on the y axis
	 .transitionDuration(0)
     .centerBar(true)	
	 .y(d3.scaleLog().domain([1,maxY]))                               // bar width Keep increasing to get right then back off.
     .x(d3.scaleLinear().domain([0, maxX+2]))
	 .xAxis().tickFormat(function(v) {return v;});

	 lengthsChart.on("renderlet", function(chart){ //dc non supporta le scale log (https://github.com/dc-js/dc.js/issues/477): hack orrendo per modificarle le barre dopo che sono state renderizzate
    	chart.selectAll("g .bar")		
            .attr("y", function(d) {
             	if (d.y === 1) {
					return(h - pixPerUnit);
              	}
              	else if (d.y===0){ //0 darebbe infinity: restituisco come valore di partenza la base del grafico
                	return h; 	
              	}
			  	else {
                	return (h - 1) - (pixPerUnit*Math.log(d.y));
               		}	
                })
            .attr("height", function(d) {
 				return h;
            });
		});

	  let vehiclesChart = dc.rowChart("#dc-vehicles-chart");

      vehiclesChart.width(w)
    .height(h)
    .margins({top: 10, right: 10, bottom: 20, left: 40})
    .dimension(type)								// the values across the x axis
    .group(types)
    .ordinalColors(['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#ffff33','#a65628'])							// the values on the y axis
	.transitionDuration(500)
	.label(function (d){
      	if (d.key===1){
      		return "1 axis";
      	}
      	else if (d.key==2){
      		return "2 axis";
      	}
      	else if (d.key==3){
      		return "2 axis ranger";
      	}
      	else if (d.key==4){
      		return "3 axis";
      	}
      	else if (d.key==5){
      		return "4 axis";
      	}
      	else if (d.key==6){
      		return "5 axis";
      	}
    })
    .elasticX(true);



   dc.renderAll();
}

function loadAll(){
	let query = 'http://localhost:3000/sensors/';
	let result=[];
	let allPoints=fetch(query).then((resp) => resp.json());
	allPoints.then(function(value) {
		value.forEach(function(val){
			result.push(val);
		})
		let sorted=sortById(result);
		let pathData=makePath(sorted);
		pathStats(pathData);
 	  	//
 	});	
}

function fetchData2(){
	const urlSensor="../data/sensor.csv";
	const urlPoints="../data/points.csv";
	let sensorData=fetch(urlSensor).then((resp) => resp.text());
	let pointData=fetch(urlPoints).then((resp) => resp.json());
	Promise.all([sensorData,pointData]).then(function(values){
		if (values[0]&&values[1]) {
  		dataStore.push(values[0]);
  		dataStore.push(values[1]);
  		prepareForCrossfilter();
			initializePathViz();
			initializeNodes();
		}
		else {
			throw new Error("error fetching data!");
		}
	});
}

function prepareForCrossfilter(data){ //fare funzionare questa roba con dati passati
	//let parsedRoutes=parse(data); non server trasformare da stringa a array
	console.log(data);
	pathData=sortAndMakePath(data);
	//return pathData
}

function appendSvg(h, w){
	d3.select("svg").remove(); //rimuove la precedente viz
  svg = d3.select("#viz") //salva svg in global per poterlo riusare dopo
     .append("svg")
     .attr("class", "svg-container")
 		 .attr("width", w)
 		 .attr("height", h);
 	//return svg;
}

function xScalePoints(minX, maxX){ //restituisce una scala con rapporto tra il dominio (valori min e max) e range (larghezza dell'svg - il padding)
	let xScale = d3.scaleLinear()
		.domain([minX, maxX])
		.range([0+padding/2, w-padding/2]);
	return xScale;
}
	
function yScalePoints(minY, maxY){ //stesso ma per l'altezza
	let yScale = d3.scaleLinear()
	.domain([minY, maxY])
	.range([0+padding/2, h-padding/2]);
	return yScale;	
}

function xScalePointsLength(n){ //rapporto tra n dei punti (lunghezza passata) e larghezza dell'svg
		let xScale = d3.scaleLinear()
		.domain([1, n])
		.range([((w-padding/2)/13), 1+padding/2]); //TODO togliere magic numbers
	return xScale;
}

function addOnclick(){
	//crossfilter dimension: qualcosa sulla base di cui effettuiamo un raggruppamento, per poi poter compiere operazioni (es somma o filtraggio)
	let nodes=svg.selectAll("circle")
	.on("click", function(d) {
		console.log("Click");
			let name=d.fullname;
			getPointData(name); //prendi i dati dal server	  
	});
}

function xScaleMapLength(n){
let xScale = xScalePointsLength(0,n);
let xMap = function (d, i){return xScale(i)}; //mappa semplicemente in base all'indice dell'array
return xMap;
}

function mapCoord(xScale, yScale){ //viene eseguito solo la prima volta: salva un array con le coordinate mappate a height e width dell'svg
		mappedCoord=dataStore.map(function (d){
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
}

function colorNodes(){
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

function drawNodes(xMap, yMap){
	let nodes=svg.selectAll("circle")
		.data(dataStore);

	nodes.enter()
		.append("circle")
		.attr("stroke", "black")
		.attr("r", 7)
		.attr("cx", xMap)
    .attr("cy", yMap)
		.on("mouseover", function(d) {
			  let div = d3.select("#viz").append("div")	//div tooltip creato al momento e rimosso con mouseout
    			.attr("class", "tooltip")				
    			.style("opacity", 0);		
      div.transition() //si può fare classe css della transition?		
          .duration(200)		
          .style("opacity", .9);		
     	div.html(d.type +" "+d.value)
     		  .style("left", (d3.event.pageX) + "px")		
          .style("top", (d3.event.pageY - 28) + "px");		
     })					
    .on("mouseout", function(d) {		
    	div = d3.selectAll(".tooltip")
      	.transition()		
         .duration(500)		
         .style("opacity", 0)	
         .remove();	

     });
}

function xScaleMap(minX,maxX){
let xScale = xScalePoints(minX,maxX);
let xMap = function (d){return xScale(d.coord[0])};
return xMap;
}

function yScaleMap(minY,maxY){
	let yScale = yScalePoints(minY,maxY);
	let yMap = function (d){return yScale(d.coord[1])};
	return yMap;
}

function initializeNodes(){
	let maxX=d3.max(dataStore, function(d){return d.coord[0]});
	let minX=d3.min(dataStore, function(d){return d.coord[0]});
	let maxY=d3.max(dataStore, function(d){return d.coord[1]});
	let minY=d3.min(dataStore, function(d){return d.coord[1]});

	let xScale = xScalePoints(minX,maxX);
	let xMap=xScaleMap(minX,maxX);

	let yScale = yScalePoints(minY,maxY);
	let yMap = yScaleMap(minY,maxY);
		

	if (mappedCoord.length===0){ //mappa le coordinate originali dei punti alle dimenzioni effettive dell'svg (se non è stato già fatto)
		mapCoord(xScale, yScale);
	}

 		drawNodes(xMap, yMap);
    colorNodes();

}

function initializePathViz(){
	var h=800;
	var w=800;
	appendSvg(h,w);
}

function initializeViz(){
	var h=800;
	var w=800;
	appendSvg(h,w);
}

function drawPathLength(){
  let groups=d3.nest() //raggruppa i dati per lunghezza del path
  	.key(function(d) {return d.path.length;})
  	.entries(actualData);

	let maxX=d3.max(groups, function(d){return +d.key});
	let minX=d3.min(groups, function(d){return +d.key});
	let maxY=d3.max(groups, function(d){return d.values.length});
	let minY=d3.min(groups, function(d){return d.values.length});

	let xScale = d3.scaleLinear()
		.domain([0, maxX+1])
		.range([padding, w-padding/2]);
	let xMap = function (d){return xScale(d.key)};
	let xAxis = d3.axisBottom(xScale);

	let yScale = d3.scaleLinear()
	.domain([0, maxY])
	.range([h-padding, 0+padding/2]); //inverte asse Y (h-padding e non h-padding/2 per lasciare più spazio per il nome dell'asse)
	let yMap = function (d){return yScale(d.values.length)};
	let yAxis = d3.axisLeft(yScale);
	 //.tickValues([10, 20, 30]);  

	function yGrid() {	
    return d3.axisLeft(yScale)
        .ticks(5)
	}

	//appende il raggruppamento dei tick che disegnano le linee orizzontali della griglia
	  svg.append("g")
      .attr("class", "grid")
      .attr("transform", "translate("+(padding)+",0)") //trasla come l'asse y
      .call(yGrid()
          .tickSize(-w+(padding*1.5)) //lunghezza *1.5 perchè sul lato sx è lasciato un padding intero
          .tickFormat("") //etichette delle linee della griglia
      );

	 svg.append("g")
      .attr("class", "y-axis")
	 	 .attr("transform", "translate("+(padding)+",0)") //traslato di un padding intero per lasciare spazio all'etichetta dell'asse y
	 		.call(yAxis);

	  svg.append("g")
      .attr("class", "x-axis")
	 	 .attr("transform", "translate(0,"+ (h-padding)+")") //traslato di un padding intero per lasciare spazio all'etichetta dell'asse x
	 	.call(xAxis);
			
  svg.append("text")             
      .attr("transform", "translate(" + (w-(padding*1.5)) + " ," + (h-padding/2) + ")")
      .text("Path length");

   svg.append("text")             
      .attr("transform", "translate(" + (padding/3) + " ," + (h/2+padding/2) + ") rotate(270)") //non si può mettere la rotazione in una dichiarazione separata altrimenti sovrascrive la precedente trasformazione
      .text("Elements");

   svg.append("g")
      .attr("class", "dots-group")
	  .selectAll(".dot")
		.data(groups)
	  .enter().append("circle")
	  .attr("class", "dot")
		.attr("r", 3.5)
	  .attr("cx", xMap)
	  .attr("cy", yMap);
}

function initializeStatViz(){
	viewType=1; 
	h=500;
	w=800;
	appendSvg(h,w);
}



function initializeCrossingViz(){
	viewType=2; 
	h=800;
	w=800;
  appendSvg(h,w);
}

function parse(data){ //questo non serve: è gia un array!!
	console.log(data);
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

function sortById(data){
	let sortedVehicles=data.sort(function(a,b){ //ordina l'array in base all'id del veicolo
		if (a.id < b.id) {
    	return -1;
  	}
  	if (a.id > b.id) {
    	return 1;
  	}
  	return 0;
	});
	return sortedVehicles
}

function makePath(sortedVehicles){ //aggiungi maxDate, minDate, pathLength!
	let arrayPath=[];
	let singlePath=new Object();
	singlePath.vehicleId=sortedVehicles[0].id;
	singlePath.vehicleType=sortedVehicles[0].type;
	singlePath.path=[];
	let timeStamp=new Object();
	timeStamp.time=sortedVehicles[0].timestamp;
	timeStamp.path=sortedVehicles[0].gate;
	singlePath.path.push(timeStamp);
	for (var i=1; i<sortedVehicles.length;i++){
		
		if (sortedVehicles[i].id!==sortedVehicles[i-1].id || (singlePath.path.length>1&&((sortedVehicles[i].gate.startsWith('entrance')&&sortedVehicles[i-1].gate.startsWith('entrance'))))){ //ARGH :D condizioni di terminazione: il veicolo seguente ha targa diversa oppure c'è un path di lunghezza >1 con due ingressi consecutivi
			/*
			let lowest = Number.POSITIVE_INFINITY;
			let highest = Number.NEGATIVE_INFINITY;
			let tmp;
			for (let i=singlePath.length-1; i>=0; i--) {
    			tmp = singlePath[i].timeStamp;
    			if (tmp < lowest) lowest = tmp;
    			if (tmp > highest) highest = tmp;
			}
			console.log(highest, lowest);
			singlePath.min=0;
			singlePath.max=1;
			*/
			let len=singlePath.path.length;
			singlePath.pathLength=len;
			arrayPath.push(singlePath);
			singlePath=new Object();
			singlePath.path=[];
			singlePath.vehicleId=sortedVehicles[i].id;
			singlePath.vehicleType=sortedVehicles[i].type;
		}
		timeStamp=new Object();
		timeStamp.time=sortedVehicles[i].timestamp;
		timeStamp.path=sortedVehicles[i].gate;
		singlePath.path.push(timeStamp);
		if (i===sortedVehicles.length-1){
			arrayPath.push(singlePath);
		}
	}
	return arrayPath;
}

function drawPath(data){
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

function drawClickableNodes(){
	let xMap=xScaleMapLength(dataStore[1].length);
	let yMap = padding; // i nodi sono posizionati in linea
	drawNodes(xMap, yMap); //risua la funzione per disegnare i nodi ma con una diversa mappatura
	colorNodes(); //i colori sono gli stessi
	return;
}

function drawGraph(){
	if(viewType!==0){
  	viewType=0;
  	initializePathViz();
  	initializeNodes();
  }
	if (actualData.length===0) {
		alert("no data to viz!");
		return;
	}
	drawPath(actualData);
}

function drawPathStats(){
	 if(viewType!==1){
  	viewType=1;
  }
  if (actualData.length===0){
  	alert("no data to viz!");
  	return;
  }
  initializeStatViz();
  drawPathLength();
  }

function drawPathCrossing(){
	if(viewType!==2){
  	viewType=2;
  }
  initializeCrossingViz();
  drawClickableNodes();
  addOnclick();
}

function nameFilter(name, data){
	console.log(data);
	console.log(name);
	let result=[];
	data.forEach(function(d){
		//if (d.path[0].path===name){ //guarda se il path inizia per il punto cliccato
			if(d.path.includes(path===name)){
			result.push(d);
		}
	});
	console.log(result);
	//return(data.filter(element => element.path.path===name));

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

loadAll();