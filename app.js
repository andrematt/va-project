const express = require('express');
const crossfilter = require('crossfilter');
const d3 = require('d3');

const app = express();
app.use(express.static("public"));
app.use('/crossfilter', express.static(__dirname + '/node_modules/crossfilter/'));
app.use('/d3', express.static(__dirname + '/node_modules/d3/dist/'));
app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist/'));
app.use('/data', express.static(__dirname + '/data/'));
//app.get('/', function(req, res){ //route handler "/" per quando viene aperto il sito
//  res.sendFile(__dirname + '/index.html');
//});

app.listen(3000, () => console.log("running on port 3000"));