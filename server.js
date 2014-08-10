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
  output: __dirname + "/data/pic.jpg",
  encoding: "jpg",
  timeout: 0, // Let's keep going
  width: 1024,
  height: 768,
  rotation: 180,
  nopreview: true,
  thumb: "none",
  timelapse: 2000
});
var cameraStarted = false;

// Let's serve static files
app.use(express.static(__dirname + '/public'));

// The server
var server = http.createServer(app);

var binaryserver = new BinaryServer({server: server, path: '/stream'});

binaryserver.on('connection', function(client){
  console.log("Client connected");
  client.send({ 
    message: "Successfully connected to server",
    clients: Object.keys(binaryserver.clients).length 
  }, { type: "json" });
});

var sendFileToAllClients = function(filename){
  console.log("Sending file", filename);
  var cs = binaryserver.clients;  
  console.log("Sending to ", Object.keys(cs).length, "clients")
  var file = fs.createReadStream(filename);
  Object.keys(cs).forEach(function(k){
    console.log("Sending file ", filename, " to ", k);
    cs[k].send(file, { type: "image" });
  })  
}

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
});

camera.on("start", function(err, timestamp){
  cameraStarted = true;
  cameraStartTime = new Date();
});

camera.on("stop", function(err, timestamp){
  cameraStarted = false;
  cameraStartTime = null;
})

app.get("/camera/start", function(req, res){
  camera.start();

  res.status = 200;
  res.send("");
});

app.get("/camera/stop", function(req, res){
  camera.stop();

  res.status = 200;
  res.send("");
});

app.get("/camera/status", function(req, res){
  res.status = 200;
  res.send(cameraStarted ? "true" : "false");
})

// Send a one time test image.
app.get("/camera/test", function(req, res){
  sendFileToAllClients(__dirname + '/public/images/test.png')
  
  res.status = 200;
  res.send("");
});

var startTime = new Date();
var cameraStartTime = null;
var ping = setInterval(function(){
  var now = new Date();
  var time = "" + now.getHours() + ":" + now.getMinutes()
  var cameraTime = "";
  if(cameraStartTime){
    cameraTime = ", cam: " + Math.round((now - cameraStartTime)/1000/60) + " min"
  }
  console.log("[ALIVE]", time, "(running:", Math.round((now - startTime)/1000/60) ,"min", cameraTime, ")" );
}, 1000);

server.listen(port);
console.log('Listening on port ' + port);