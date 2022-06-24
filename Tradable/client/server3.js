var fs = require('fs');
var https = require('https');
const socket = require("socket.io");
var express = require('express');
const checkAddress = require('./indexxUnn.js');
var app = express();

var options = {
    key: fs.readFileSync('private-key.pem'),
    cert: fs.readFileSync('public-cert.pem')
};
const HOST = '0.0.0.0';
var serverPort = 3000;

var server = https.createServer(options, app);

const io = socket(server, {
  cors: {
    origin: '*',
  }
});

io.on("connection", function (socket) {
  console.log("Made socket connection");
  
    socket.on('CH01', function (from, msg) {
	    console.log('MSG', from, ' saying ', msg);
	    checkAddress.initiate(0.001,msg.toString(),12,1,io,socket).then(result => {
	    	console.log(result);
	    	io.to(socket.id).emit('Final', result);
	    	socket.disconnect(true);
	    }).catch(error => {
		  console.log("Error;",JSON.stringify(error));
		  //res.statusMessage = JSON.stringify(error);
		  //res.status(400).send(JSON.stringify(error))
		  io.to(socket.id).emit('error', JSON.stringify(error));
		  //res.end()
	      }) 
    });
    socket.on('end', function (){
    	socket.disconnect(0);
    });
    
});

server.listen(serverPort,HOST, function() {
  console.log(`Listening on port ${serverPort}`);
  console.log(`http://${HOST}:${serverPort}`);
});
