var port = 3000;

// The app
var http = require('http')
var express = require('express');
var binaryjs = require('binaryjs');
var fs = require('fs');

var BinaryServer = binaryjs.BinaryServer;
var app = express();

// Let's serve static files
app.use(express.static(__dirname + '/public'));

// The server
var server = http.createServer(app);

var binaryserver = new BinaryServer({server: server, path: '/stream'});

binaryserver.on('connection', function(client){
  var file = fs.createReadStream(__dirname + '/flower.png');
  client.send(file);
});

app.get("/snap", function(req, res){
  var o = [];
  var cs = binaryserver.clients;
  var file = fs.createReadStream(__dirname + '/test.png');
  Object.keys(cs).forEach(function(k){
    cs[k].send(file);
    o.push([k]);
  })
  
  res.send(JSON.stringify(o));
})

server.listen(port);
console.log('Listening on port ' + port);