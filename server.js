var port = 3000;

// The app
var http = require('http')
var express = require('express');
var binaryjs = require('binaryjs');
var fs = require('fs');
var RaspiCam = require("raspicam");



var BinaryServer = binaryjs.BinaryServer;
var app = express();
var camera = new RaspiCam({ 
  mode: "photo",
  output: __dirname + "/data/pic%d.jpg",
  encoding: "jpg",
  timeout: 0
});

// Let's serve static files
app.use(express.static(__dirname + '/public'));

// The server
var server = http.createServer(app);

var binaryserver = new BinaryServer({server: server, path: '/stream'});

binaryserver.on('connection', function(client){
  var file = fs.createReadStream(__dirname + '/flower.png');
  client.send(file);
});

var sendFileToAllClients = function(filename){
  console.log("Sending file", filename);
  var cs = binaryserver.clients;  
  console.log("Sending to ", Object.keys(cs).length, "clients")
  var file = fs.createReadStream(filename);
  Object.keys(cs).forEach(function(k){
    console.log("Sending file ", filename, " to ", k);
    cs[k].send(file);
  })  
}

app.get("/snap", function(req, res){
  camera.start();
  res.send("Taken photo");
})

camera.on("read", function(err, timestamp, filename){ 
  console.log("Took photo ", filename);
  var path = __dirname + "/data/" + filename;
  if(filename.match("~")){
    console.log("tempfile", filename);
    return;
  }
  
  console.log("Check path", path);
  fs.exists(path, function(exists){
    console.log("Path", path, exists);
    if(exists){
      sendFileToAllClients(path);
    }
  });
  camera.stop();  
});

app.get("/snap-test", function(req, res){
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