const Web3 = require('web3');
const ganache = require("ganache");
const request = require('request');
const prompt = require('prompt');
const PancakeFactory = require("../build/contract/pancakeFactory.json");
const PancakeRouter = require("../build/contract/pancakeRouter.json");
const ERC20 = require("../build/contract/ERC20.json");

prompt.start();        

prompt.get(['path'], function (err, result) {

    if (err) {
      return onErr(err);
    }
    let token = result.path
    //unlockAddress = result.unlockAddr;
    //console.log("Unlock Addr:-",unlockAddress);
    getAbi(token)
    //init();
  });

  function onErr(err) {
    console.log(err);
    return 1;
  }

let provider = null
let web3 = null
const getAbi = async(token)=>{

    let creator = await contractCrat(token);
    console.log(creator)
    options = {"fork":"https://bsc.getblock.io/mainnet/?api_key=3a7a0d72-40df-4821-9250-14e0495414bb","wallet":{"unlockedAccounts":[creator,"0x0000000000000000000000000000000000000000"]}};
    provider = ganache.provider(options);
    web3 = new Web3(provider);
    let address  = await web3.eth.getAccounts();
    let wbnb = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
    let pair = await getPair(web3,address,token,wbnb);

    console.log("Contract pair",pair)
    let isLock = await searchLock(pair)

    console.log("Locked",isLock)
    let sswap = await swap(web3,address,token,wbnb);
    console.log("Swap",sswap.status)
    let ssswap = await swapBack(web3,address,token,wbnb);
    console.log("SwapBack",ssswap.status)

    
    console.log("======================================================================================")

    let sxswap = await swap(web3,address,token,wbnb);
    console.log("TSwap",sxswap.status)

    let sendTranx = await web3.eth.sendTransaction({from: address[0], to: creator, value: "50000000000000000000"}).catch(err=>{
        console.log("E-RRR",err);
    })
    console.log(sendTranx);

    request('https://api.bscscan.com/api?module=contract&action=getabi&address='+token+'&apikey=EKE3AVA4DTPVJRSB2M1UDFG3AXF7TNIZZT', async function (error, response, data) {
    var contractABI = "";
    contractABI = JSON.parse(data);
    if (contractABI != '') {
        contractABI = JSON.parse(contractABI.result)
        console.log("Functions",contractABI.length)
        //console.log(contractABI)
        var MyContract = new web3.eth.Contract(contractABI,token);
        for (let i = 0; i <contractABI.length; i++) {
            if (contractABI[i].stateMutability!="view" && contractABI[i].type == "function") {
                console.log("Funvtiond",contractABI[i]);
                let inputsLength = contractABI[i].inputs
                let inputs = "";
                let addresses = ["0x00CC0712a59be5D9239f8424094Dca7b3A6806f0",creator,address[1],address[2],address[3],address[4]]
                for (let j = 0;j< inputsLength.length;j++) {
                    if (inputsLength[j].type =="address") {
                        inputs = inputs.concat("'"+creator+"'",",")
                    } else if (inputsLength[j].type =="bool") {
                        inputs = inputs.concat("true",",")
                    }else if (inputsLength[j].type =="uint256") {
                        inputs = inputs.concat("'1000000000000000000'",",")
                    }else if (inputsLength[j].type =="bytes32") {
                        inputs = inputs.concat("'"+web3.utils.asciiToHex("owner")+"'",",")
                    }else if (inputsLength[j].type =="address[]") {
                        inputs = inputs.concat("['"+creator+"','"+address[0]+"','"+address[1]+"']",",")
                    }else if (inputsLength[j].type =="uint256[]") {
                        inputs = inputs.concat("['1000000000000000000','10000000','10000']",",")
                    }else if (inputsLength[j].type =="bytes32[]") {
                        inputs = inputs.concat("['"+web3.utils.asciiToHex("owner")+"']",",")
                    }
                }
                let functionName = "MyContract.methods."+contractABI[i].name+"("+inputs.substr(0,inputs.length-1)+")";//contractABI[i].name;
                console.log(functionName)
                if ((contractABI[i].name == "transferFrom") || (contractABI[i].name == "transfer")) {
                    console.log("Pass")
                }else{
                    let trnx = await eval(functionName).send({from:creator,gas:3000000,gasPrice:10000000000}).catch(async err=>{
                        console.log("Trying Address zero")
                        let zero = await eval(functionName).send({from:"0x0000000000000000000000000000000000000000",gas:3000000,gasPrice:10000000000}).catch(errr=>{
                            console.log(errr)
                        });

                        console.log(zero)
                    }) 
                    console.log(trnx)   
                    console.log("-------------------------------------------------------------------------");                
                }

                
                
            }
        }
        ///swapback
        let sssxwap = await swapBack(web3,address,token,wbnb);
        console.log("SwapBack",sssxwap.status)

        console.log("========================================================================================");
        //var myContractInstance = MyContract.at("0xc342fe52c3dde5785168c4ff78c1db3b9b35ce74");

    } else {
        console.log("Error");
    }
});
}
//0x04d5a40c8f0be0e095c190ef24c74143f9fac5da
//https://api.bscscan.com/api?module=account&action=txlist&address='+token+'&startblock=0&endblock=99999999&page=1&offset=100&sort=asc&apikey=S93WAM9DQ93V4VKZF5UIGX5N5DVC7R1CMH
const contractCrat = async(token)=>{
    //let address  = await web3.eth.getAccounts();
    return new Promise((resolve,reject)=>{
        try {
            request('https://api.bscscan.com/api?module=account&action=txlist&address='+token+'&startblock=0&endblock=99999999&page=1&offset=100&sort=asc&apikey=S93WAM9DQ93V4VKZF5UIGX5N5DVC7R1CMH', async function (error, response, data) {
                var resultz = "";
                resultz = JSON.parse(data);
                //let trnx = JSON.parse(resultz.result)
                if (resultz != '') {
                    //console.log(resultz.result[0].from)
                    return resolve(resultz.result[0].from)
                }

            });            
        } catch (error) {
            reject(error)
        }

    });
}
const searchLock = async(token)=>{
    //let address  = await web3.eth.getAccounts();
    return new Promise((resolve,reject)=>{
        try {
            request('https://api.bscscan.com/api?module=account&action=txlist&address='+token+'&startblock=0&endblock=99999999&page=1&offset=100&sort=asc&apikey=S93WAM9DQ93V4VKZF5UIGX5N5DVC7R1CMH', async function (error, response, data) {
                var resultz = "";
                resultz = JSON.parse(data);
                //let trnx = JSON.parse(resultz.result)
                if (resultz != '') {
                    //console.log(resultz.result)
                    let nolock = 0
                    for (let i = 0;i<resultz.result.length;i++){
                        let approve = "0x095ea7b3";
                        let method = JSON.stringify(resultz.result[i].input).substr(1,10);

                        if (method == approve) nolock+=1;
                       //console.log(JSON.stringify(resultz.result[i].input).substr(1,10)) 
                       //console.log(nolock)
                    }
                    if (nolock>0)
                        return resolve("Locked")
                    else
                        return resolve("Not Locked")
                }

            });            
        } catch (error) {
            reject("Unlocled")
        }

    });
}

//https://api.bscscan.com/api?module=account&action=txlist&address=0x04d5a40c8f0be0e095c190ef24c74143f9fac5da&startblock=0&endblock=99999999&page=1&offset=100&sort=asc&apikey=S93WAM9DQ93V4VKZF5UIGX5N5DVC7R1CMH

const getPair = async(web3,address,token,wbnb) => {
    return new Promise(async(resolve,reject)=>{
        let factory = new web3.eth.Contract(
            PancakeFactory.abi,
            "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73"
        );    
        let pair = await factory.methods.getPair(token,wbnb).call({from:address[0]}).catch(e=>{return reject(e)})
        resolve(pair)
    })



}

const swap = async(web3,address,token,wbnb) => {
    return new Promise(async(resolve,reject)=>{
        let amountIn = 0.5
        let router = new web3.eth.Contract(
            PancakeRouter.abi,
            "0x10ED43C718714eb63d5aA57B78B54704E256024E"
        );
        let swap = await router.methods.swapExactETHForTokensSupportingFeeOnTransferTokens(
            0,
            [wbnb,token],
            address[0],
            Math.floor(Date.now() / 1000) + 60 * 10).send({from:address[0],value:web3.utils.toWei(amountIn.toString(),'ether'),gas:600000,gasPrice:10000000000}).catch(e=>{console.log(e);return reject(e)});
        resolve(swap)
    })
}

const swapBack = async(web3,address,token,wbnb) => {
    return new Promise(async(resolve,reject)=>{
        let amountIn = 0.5
        let router = new web3.eth.Contract(
            PancakeRouter.abi,
            "0x10ED43C718714eb63d5aA57B78B54704E256024E"
        );
        let BUSD_ERC20 = new web3.eth.Contract(
            ERC20.abi,
            token
        );
        let amountTokenIn0 = await BUSD_ERC20.methods.balanceOf(address[0]).call({from:address[0]});
        let approve = await BUSD_ERC20.methods.approve("0x10ED43C718714eb63d5aA57B78B54704E256024E",amountTokenIn0).send({from:address[0]});

        let swap = await router.methods.swapExactTokensForETHSupportingFeeOnTransferTokens(
                                    amountTokenIn0,
                                    0,
                                    [token,wbnb],
                                    address[0],
                                    Math.floor(Date.now() / 1000) + 60 * 10).send({from:address[0],gas:600000,gasPrice:10000000000}).catch(err=>{console.log("E-RR",err);reject("Error: Transfer_From_Failed");});
        resolve(swap)
    })
}