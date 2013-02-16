var util   = require('util'),
    spawn = require('child_process').spawn;

var io = require('socket.io');   


var express = require('express');
var app = express();

var serverPort = 3001;
var serverAddr = '127.0.0.1';

app.configure(function (){
  app.use(express.static(__dirname + '/public'));
});

var sar = null;

var tsData = new Array();

var rate = 1;

function collectData() {

  sar = spawn('sar', ['-u', ''+rate]); 

  
  sar.stdout.on('data', function (data) {
    var dataArray = data.toString().split('\n')[3].replace('/\n/gi','').split(' ');
    var timestamp = new Date(new Date().getTime());
    if ((dataArray[dataArray.length-1]*1.0).toString() == 'NaN') return;
    var load = Math.round(100 - 1.0*dataArray[dataArray.length-1]);
    tsData.push({timestamp: timestamp, load: load});
    if (tsData.length > 3600/rate) tsData.shift();
  });

  sar.stderr.on('data', function (data) {
   util.print('stderr: ' + data);
  });

  sar.on('exit', function (code) {
    setTimeout(collectData, rate * 1000);
    
  });
}

app.get('/sar', function(req, res){

    if (sar==null) collectData();

    //util.print(JSON.stringify(tree));
    res.writeHead(200, {'Content-Type': 'application/json','Content-Length':JSON.stringify(tsData).length});
    res.end(JSON.stringify(tsData));
    
     

  

});



collectData();
app.listen(serverPort,serverAddr);


// websockets stuff

var sendData = 0;
var socket = io.listen(app);

// to allow broadcast we need to manage the clients connected
var clients = new Array();

socket.on('connection', function(client){
  //sendData++;
  // store the client
  clients.push(client);
  util.print("CNXN\n");
  // kick off a new write loop for the first client;
  if (clients.length==1) writeData(client);
  client.on('disconnect', function(){
    //sendData--;
    // find the client in our list and remove it
    var index;
    var found = false;
    for (index=0;index < clients.length && found == false; index++){
      if (clients[index].sessionId = client.sessionId)
        found = true;
    }
    // remove the client that d/c
    if (found)
      clients = clients.slice(0,index).concat(clients.slice(index+1));
  });
});

function writeData(client){
  if (clients.length>0){
    util.print("Sending Data\n");
    // broadcast to all clients at the same rate
       // send again in the future
        if (clients.length > 1) client.broadcast(JSON.stringify(tsData));
        else client.send(JSON.stringify(tsData));
	setTimeout(writeData,rate*2*1000,clients[0]);
    }
    
  
  
}




