const express = require("express");
const socket = require("socket.io");
const checkAddress = require('./indexxUnn.js');

// App setup
const HOST = '0.0.0.0';
const PORT = 3000;
const app = express();
const server = app.listen(PORT,HOST, function () {
  console.log(`Listening on port ${PORT}`);
  console.log(`http://${HOST}:${PORT}`);
});

// Static files
// Socket setup
const io = socket(server, {
  cors: {
    origin: '*',
   methods: ["GET", "POST"]
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
