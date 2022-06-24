"use strict";
const asyncc = require('async');
const checkAddress = require("../Tradable/client/indexxClass.js");
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
        const queue = asyncc.queue((param, completed) => {
          socket.join(param.f);
          console.log("Currently Busy Processing Task " + param.f+"FFF"+param.m);
          //
          new checkAddress().main(0.001,param.m.toString(),12,50,io,socket,param.f).then(result => {
              console.log(result);
              io.sockets.in(param.f).emit('Final', result);
            socket.disconnect(true);
            const remaining = queue.length();
            completed(null, {param, remaining});
            
            }).catch(error => {
            console.log("Error;",JSON.stringify(error));
            //res.statusMessage = JSON.stringify(error);
            //res.status(400).send(JSON.stringify(error))
            io.sockets.in(param.f).emit('error', JSON.stringify(error));
            const remaining = queue.length();
            completed(null, {param, remaining});
            //res.end()
              }) 
        },1)
      queue.drain(() => {
          console.log('Successfully processed all items');
      })    
//    queue.drain = function () {
  //        console.log('all items have been processed');
//        }
        socket.on('CH01', function (from, msg) {
              console.log('MSG', from, ' saying ', msg);

              queue.push({f:from,m:msg}, (error, {task, remaining}) => {
                if(error){
                  console.log(`An error occurred while processing task ${task}`);
                } else {
                  console.log(`Finished processing task ${task}
                       . ${remaining} tasks remaining`);
                }
                });
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
    
