var io = require('socket.io-client');
const prompt = require('prompt');

prompt.start();
let address = null;
let path = null;
prompt.get(['address', 'path'], function (err, result) {
    if (err) {
        return onErr(err);
    }
    address = result.address;
    path = result.path;

    init();
});
function onErr(err) {
    console.log(err);
    return 1;
}
const init = () =>{
//0x971cd2f4cdd74ef70a2cf3dfef3c7c0f2c494df3
       
    let option_s =  {
        reconnect: false,
        transports: ['websocket', 'polling', 'flashsocket'],
        secure:false,
        rejectUnauthorized:false
    }
    let socket = io.connect('https://oghvtthisis.xyz', option_s);
    
    socket.on('connect', function (socket) {
        console.log('Connected!');
    });
    socket.emit('CH01', address, path);
    socket.on('private', function(msg) {
        console.log(msg)
        //transactionsUpdates(msg)
    }); 
    socket.on('Final', function(msg) {
            
        console.log(msg);
        socket.emit('end');
        //return resolve(msg)
    });      
    socket.on('error', function(err) {
        console.log("Error: " + err);
        socket.emit('end');
        //reject(err)
    }); 
}