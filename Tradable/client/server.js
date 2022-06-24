const http = require('http');
const checkAddress = require('./indexxUn.js');

const hostname = '127.0.0.1';
const port = 3076;

const server = http.createServer((req, res) => {

  res.statusCode = 200;
  console.dir(req.param)
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method == 'POST') {
    console.log('POST')
    var body = ''
    req.on('data', function(data) {
      body += data
      console.log('Partial body: ' + body)
    })
    req.on('end', function() {
      console.log('Body: ' + body.split("=")[1])
      let address = body.split("=")[1];
      checkAddress.initiate(0.001,address.toString(),12,1).then(result => {
      		//console.log("Resue;",JSON.stringify(result));
      		res.writeHead(200, {'Content-Type': 'application/Json'})
      		res.end(JSON.stringify(result))
      		
      }).catch(error => {
          console.log("Error;",JSON.stringify(error));
          //res.statusMessage = JSON.stringify(error);
          //res.status(400).send(JSON.stringify(error))
        	res.end(JSON.stringify(error))
      }) 

    })
  }
});
server.on("error",err => console.log(err));
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
//0x3e43e9AF48c1b34800F928AC3755faeADC0E5F81
//0x0af3fc5125ae15d45780fb9cac784f9f6946b563
//0x3fCF8A56A92a976E8C005F9550fcEa14893d599C
//0xd40bedb44c081d2935eeba6ef5a3c8a31a1bbe13
//0x26193c7fa4354ae49ec53ea2cebc513dc39a10aa
//0xf0a8ecbce8caadb7a07d1fcd0f87ae1bd688df43
