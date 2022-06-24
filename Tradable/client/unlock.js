const axios = require('axios');
var request = require('request');

const qs = require('qs');
let data = {"name":"VTBEA","symbol":"VT","address":"0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47","icon":"unkown.png"}


request('https://itstradable.info/coins/tradable.json', function (error, response, body) {
  var contractTrnx = "";
    if (!error && response.statusCode == 200) {
      contractTrnx = JSON.parse(body);
      contractTrnx.DexCoin.push(data);
      //console.log(JSON.stringify(contractTrnx));

      axios.post('https://itstradable.info/coins/tradable.php',  qs.stringify({
    'json': JSON.stringify(contractTrnx)
      }))
      .then((res) => {
        console.log(`statusCode: ${res.statusCode}`)
        //console.log(res)
        console.log(`statusCode: ${JSON.stringify(res.data)}`)
      })
      .catch((error) => {
        console.error(error)
      })
    }
});


function refreshList() {
  let data = {"DexCoin":[]}
  axios.post('https://itstradable.info/coins/tradable.php',  qs.stringify({
    'json': JSON.stringify(data)
      }))
      .then((res) => {
        console.log(`statusCode: ${res.statusCode}`)
        //console.log(res)
        console.log(`statusCode: ${JSON.stringify(res.data)}`)
      })
      .catch((error) => {
        console.error(error)
      })
}


request('https://itstradable.info/coins/tradable.json', function (error, response, body) {
  var contractTrnx = "";
    if (!error && response.statusCode == 200) {
      contractTrnx = JSON.parse(body);
      for (let i=0; i <contractTrnx.DexCoin.length;i++) {
        console.log("Address",contractTrnx.DexCoin[i].address);
        if (decodeInput[1][0].toString() == weth && decodeInput[1][decodeInput[1].length-1].toString()== Web3.utils.toChecksumAddress(contractTrnx.DexCoin[i].address) && parseFloat(amountBnb)>0.1) {
          console.log("Clicked");

          FrontRun.swapThruBot(decodeInput[1],toFixed(AMOUNT),decodeInput[0].toString(),tradeAmount,Web3.utils.toChecksumAddress(tokenAddress[i]),parseInt(trx.gasPrice));

        }

      }

    }
});