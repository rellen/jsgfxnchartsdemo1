var util   = require('util'),
    spawn = require('child_process').spawn;

var io = require('socket.io');   


var express = require('express');
var app = express.createServer();

app.configure(function (){
  app.use(express.staticProvider(__dirname + '/public'));
});

var sar = null;

var tsData = new Array();

var rate = 6;

function startup(){

  sar = spawn('sar', ['-u', ''+rate]); 

  sar.stdout.on('data', function (data) {
   // util.print('STDOUT: ' + data.toString());
    //sarResult += ''+data.toString().replace('\n','\t');  

    var dataArray = data.toString().replace('/\n/gi','').split(' ');
    var timestamp = new Date().getTime();
   // util.print(timestamp+'\n');
    if ((dataArray[dataArray.length-1]*1.0).toString() == 'NaN') return;
    var load = Math.round(100 - 1.0*dataArray[dataArray.length-1]);
   // util.print(load+'\n');
    tsData.push([timestamp, load]);
    if (tsData.length > 3600/rate) tsData.shift();

  });

  sar.stderr.on('data', function (data) {
   util.print('stderr: ' + data);
  });

  sar.on('exit', function (code) {
    console.log('child process exited with code ' + code);
  });

}

app.get('/sar', function(req, res){


    if (sar==null) startup();
  

    //util.print(JSON.stringify(tree));
    res.writeHead(200, {'Content-Type': 'application/json','Content-Length':JSON.stringify(tsData).length});
    res.end(JSON.stringify(tsData));
    
     

  

});



startup();
app.listen(3001,'127.0.0.1');


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



