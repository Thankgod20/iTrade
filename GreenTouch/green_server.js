
"use strict";
const checkAddress = require("../Tradable/client/indexxUnn.js");
require("greenlock-express").init({
        packageRoot: __dirname,
        configDir: "./greenlock.d",

        maintainerEmail: "support@itstradable.info",
        cluster: false
    }).ready(httpsWorker);

function httpsWorker(glx) {
    let socketio = require("socket.io");
    let io;
    let server = glx.httpsServer();

    io = socketio(server, {
        cors: {
          origin: '*',
        }
      });

      io.on("connection", function (socket) {
        console.log("Made socket connection");
        
          socket.on('CH01', function (from, msg) {
              console.log('MSG', from, ' saying ', msg);
              
              require("../Tradable/client/indexxUnn.js").initiate(0.001,msg.toString(),12,10,io,socket).then(result => {
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

      glx.serveApp(function(req, res) {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end("Hello, World!\n\n💚 🔒.js");
    });
}
