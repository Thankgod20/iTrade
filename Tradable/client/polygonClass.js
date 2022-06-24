const Web3 = require('web3');
const ganache = require("ganache");
const HDWalletProvider = require('@truffle/hdwallet-provider');
const prompt = require('prompt');
const WETH = require("../build/contract/WETH.json");
const PancakeRouter = require("../build/contract/pancakeRouter.json");
const PancakeFactory = require("../build/contract/pancakeFactory.json");
const FrontRunBot = require("../build/contract/FrontRunBotz.json");
const Trader = require("./FrontRunLive")
const ERC20 = require("../build/contract/ERC20.json");
const BN = require("bn.js");
const axios = require('axios');
var request = require('request');

const qs = require('qs');

const { Telegraf } = require('telegraf');

const bot = new Telegraf("5164100242:AAHXl8hxW9wYkLSRtY3tx8FsOKBBz7viziw");
var options = null;//{"fork":"https://bsc.getblock.io/mainnet/?ap>
var provider = null;

var web3 = null;

let FrontRunBotAddr ="0x495856af0A806c4d706B3cFD235650589981967d";//"0xD15DeD429E7d04cC49488469916f36D958a0E6eD";//"0x618ffF1BA08Ac2c5A53fCC1FDeD636D02D99705D";//"0x193263e1103207Fba4fEDfADD4d98DB4>

let address = null;
let balance = null;



prompt.start();
let amount = null;
let token = null;
let slipAmount = null
let tradableAddr = "null,";
let tradeOptions = null;
let swapReport = null;
let counter = 0;
let currentBoolean = true;
let liquidityBNB = null
let unlockAddress = null;
let unKnownID = 0;
let unlockedAddressList = [];
let Contaddress = null;
let passState = null;
let addressInclued = null;
let routerAddress = null;

prompt.get(['amount', 'path','slip','liquidity'], function (err, result) {

    if (err) {
      return onErr(err);
    }
    console.log('Command-line input received:');
    amount = parseFloat(result.amount);
    console.log('  amount: ' + amount);
    let tokenAddr = result.path;
    token = Array.from(tokenAddr.split(','));
    console.log('  path: ', token);
    slipAmount = parseFloat(result.slip)/100;
    console.log("Slippage:-",slipAmount)
    tradeOptions = result.trade;
    liquidityBNB = parseFloat(result.liquidity);
    console.log("Liquidity:-",liquidityBNB);
    //unlockAddress = result.unlockAddr;
    //console.log("Unlock Addr:-",unlockAddress);
    checkTransactions(token)
    //init();
  });

  function onErr(err) {
    console.log(err);
    return 1;
  }


 // https://bsc-dataseed.binance.org
const checkTransactions = async (trnx) => {
    var optionsTrnx = {"fork":"https://matic.getblock.io/mainnet/?api_key=3a7a0d72-40df-4821-9250-14e0495414bb"};
    var providerTrnx = ganache.provider(optionsTrnx);
    var web3Tranx = new Web3(providerTrnx);

    request('https://api.polygonscan.com/api?module=account&action=txlist&address='+trnx[0]+'&startblock=0&endblock=99999999&page=1&offset=100&sort=asc&apikey=T1TBH19TFUSP5B7PCND4FA6RAYXQU9F55V', function (error, response, body) {
    console.log('https://api.polygonscan.com/api?module=account&action=txlist&address='+trnx[0]+'&startblock=0&endblock=99999999&page=1&offset=100&sort=asc&apikey=T1TBH19TFUSP5B7PCND4FA6RAYXQU9F55V');
    var contractTrnx = "";
    if (!error && response.statusCode == 200) {

        contractTrnx = JSON.parse(body);
        for (let i=1;i<contractTrnx.result.length;i++) {
            let trxnMethod = contractTrnx.result[i].input.substring(0,10);
            let approveId = "0x095ea7b3";//Approve
            let transferId = "0xa9059cbb";//Transfer
            let burnID = "0x7b47ec1a";//Burn
            
            if (trxnMethod != approveId && trxnMethod != transferId && trxnMethod != burnID) {
                
                unKnownID +=1;
                
                console.log("UNknownID:-",unKnownID);
                console.log("result2 : " + contractTrnx.result[i].blockNumber+",Method:-"+trxnMethod+",input:-"+contractTrnx.result[i].input);
                console.log(contractTrnx.result[i].input.includes("000000000000000000000000"));
                if (contractTrnx.result[i].input.includes("000000000000000000000000")) {
                    //addressInclued = contractTrnx.result[i].input.includes("000000000000000000000000");
                    let addr = contractTrnx.result[i].input.split('000000000000000000000000');
                    console.log("Address:-", addr)
                    Contaddress = "0x"+addr[1];
                    console.log("Is this Address:-",web3Tranx.utils.isAddress(Contaddress));
                    if (web3Tranx.utils.isAddress(Contaddress)) {
                        addressInclued = true;
                       // checkContractAddr(Contaddress,web3Tranx);
                    }
                } 
                
            } 
        }
        if (unKnownID == 0) {
            init("");
        } else if (!addressInclued) {
            init("");
        }else {
            checkContractAddr(Contaddress,web3Tranx);
        }

         //
    } else {
        console.log("Error");
    }
});
}
const checkContractAddr = async(Caddress,web3Tranx) => {
    request('https://api.polygonscan.com/api?module=account&action=txlist&address='+Caddress+'&startblock=0&endblock=99999999&page=1&offset=100&sort=asc&apikey=T1TBH19TFUSP5B7PCND4FA6RAYXQU9F55V', function (error, response, body) {
        var contractTrnx = "";
        if (!error && response.statusCode == 200) {
            contractTrnx = JSON.parse(body);
	 try {
            //console.log("Contract input",contractTrnx.result[0].input);
            if (contractTrnx.result[0].input.includes("000000000000000000000000")) {
                let addr = contractTrnx.result[0].input.split('000000000000000000000000');
                //console.log("Address:-", addr);
                for (let i = 0; i<addr.length;i++) {
                    let Contaddress = "0x"+addr[i];
                    if (web3Tranx.utils.isAddress(Contaddress)) {
                        unlockedAddressList.push(Contaddress)
                        console.log("Address:-",unlockedAddressList);


                    }
                }                        
                if (unlockedAddressList.length>1) {
                    if (unlockedAddressList[1] != token[counter]) {
                        unlockAddress = unlockedAddressList[1];
                        init(unlockedAddressList[1])
                    } else {
                        unlockAddress = unlockedAddressList[0];
                        init(unlockedAddressList[0])
                    }
                       
                } else {
                    init("");
                }
            } else {
                init("");
            }
	}catch (error) {
		init("");	
	}
	} 
    });
}
const init = async(unlockAddress) => {
    if (unlockAddress != "") {
        
        options = {"fork":"https://matic.getblock.io/mainnet/?api_key=3a7a0d72-40df-4821-9250-14e0495414bb","wallet":{"unlockedAccounts":[unlockAddress.toString()]}};
        console.log("Using UnlockedAddr")
    }
    else{
        options = {"fork":"https://matic.getblock.io/mainnet/?api_key=3a7a0d72-40df-4821-9250-14e0495414bb"}; 
        console.log("Using Normal Test")
    }
    provider = ganache.provider(options);
    web3 = new Web3(provider);


    let wbnb = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";//"0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";
    let usdc = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
    let usdt = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";

    address = await web3.eth.getAccounts();
    console.log(address);
    balance = await web3.eth.getBalance(address[0]);
    console.log("Address one Balance:-",balance);    
    //WBNB balance
    const weth_contract = new web3.eth.Contract(
        WETH.abi,
        wbnb
    );


    let sushiFactory = "0xc35DADB65012eC5796536bD9864eD8773aBc74C4";
    let sushiRouter = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506";

    let quickswapFactory = "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32";
    let quickswapRouter = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff";


    let dex = [sushiFactory,quickswapFactory];
    let fiat = [wbnb,usdc,usdt];
    let thepath = null;//[wbnb,token[counter]]
    console.log("tokenZero",token[counter]);
    let found = false;
    for (let i = 0; i <dex.length;i++){
        let factory = new web3.eth.Contract(
            PancakeFactory.abi,
            dex[i]
        );
        for (let j = 0; j< fiat.length;j++) {
            let pair = await factory.methods.getPair(fiat[j],token[counter]).call({from:address[0]}).catch(err=>{console.log(err)});
            if (pair != "0x0000000000000000000000000000000000000000") {
                if (fiat[j] == wbnb) 
                    thepath = [wbnb,token[counter]];
                else
                    thepath = [wbnb,fiat[j],token[counter]];
                 
                routerAddress = dex[i]==sushiFactory?sushiRouter:quickswapRouter;
                console.log("Path",thepath)
                console.log("Pair",pair)
                console.log("RouterAddress",routerAddress)
                found = true;
                break;
            }
        }

        if (found) {
            break;
        }
        
    }
    const weth_totalBalance = await weth_contract.methods.totalSupply().call({from:address[0]});
    console.log("Weth Balance:-",weth_totalBalance);
    console.log("Current Counter",counter);
    //let thepath = [wbnb,token[counter]]
    while(currentBoolean) {
        swapToken(amount,thepath);
        currentBoolean = false;
        if (counter<token.length)
            counter+=1;
    }
    
    

}

const swapToken = async (amountIn,path) => {
    console.log("Address:-",address[0]);
    let frontrunbot = new web3.eth.Contract(
        FrontRunBot.abi,
        FrontRunBotAddr
    ); 
    let slip = 12/100;
    let router = new web3.eth.Contract(
        PancakeRouter.abi,
        routerAddress//"0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff"
    );
    let BUSD_ERC20 = new web3.eth.Contract(
        ERC20.abi,
        path[path.length-1]
    );
   // console.log("Router:-",router.methods.getAmountsOut());
    try {
        return router.methods.getAmountsOut(
            web3.utils.toWei(amountIn.toString(),'ether') ,
            path
        ).call({from:address[0]}).then(async getAmountMin=> {
            console.log("Amount-MinOut:-",parseInt(getAmountMin[path.length-1]));
            let amountMin = parseInt(getAmountMin[path.length-1]);
            let Slippage = amountMin-(amountMin*parseFloat(slip));
            
           //Trader.swapThruBot(path,web3.utils.toWei(amountIn.toString(),'ether'),0,0.001,path[path.length-1],"10000000000");
            console.log('Slipage Amount:-',Slippage);
    
                let swapfirst = await router.methods.swapExactETHForTokensSupportingFeeOnTransferTokens(
                    Slippage.toString().split('.')[0],
                    path,
                    address[0],
                    Math.floor(Date.now() / 1000) + 60 * 10).send({from:address[0],value:web3.utils.toWei(amountIn.toString(),'ether'),gas:600000,gasPrice:10000000000}).catch(err=>{console.log("E-RR",err);});;
                //console.log("Swap Report:-",swapBUSD);
                for (let x in swapfirst.events){
                    //console.log("Data:-",parseInt(result.events[x].raw.data,16));
                    console.log("Swap Back Contract:-",swapfirst.events[x].raw);
                }      
    
                //SwapBack
                let amountTokenIn0 = await BUSD_ERC20.methods.balanceOf(address[0]).call({from:address[0]});
                console.log("Amount of TOken Recieved Addr zero:-",web3.utils.fromWei(amountTokenIn0.toString(),'ether'));
           
    
                if (!web3.utils.isAddress(unlockAddress))
                    whaleBuy(path)
                else 
                    whaleBuyUnlock(path)
            //sleep(1000).then(()=>{});
        }).catch(err=>{
            console.log("E-RR",err);
                if (counter<token.length){
                    currentBoolean = true;
                    //init();
                    checkTransactions(token)
                 }
                 console.log("Current Counter",counter);
                 console.log("Tradable Address:-",tradableAddr);
                 console.log("-----------------------------------------------------------------------");
        });   
        /** 
        return frontrunbot.methods.thisIsOghVT(trnx,"1000000000000000",0,web3.utils.toWei(amountIn.toString(),'ether')).send({from:address[0],gas:500000,gasPrice:5000000000}).then(async result => {
            //console.log(result);
            for (let x in result.events){
                if (result.events[x].raw) {
                    if (result.events[x].raw.topics[0] == "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef") {
                        let toFix = toFixed(parseInt(result.events[x].raw.data,16));
                        let split = toFix.toString().split('.')[0];
                        let toEther = web3.utils.fromWei(split,'ether');
                        console.log("Token-Data:-",toEther);  
                         }
                    }
            console.log("Swap Back Contract:-",result.events[x].raw);
           }
            for (let x in result.events.log) {

                console.log("FlashLoan Report:-",result.events.log[x].returnValues.message,"Value:-",result.events.log[x].returnValues.val.toString()); 

            } 
            //getReserve("0x10ED43C718714eb63d5aA57B78B54704E256024E",trnx,web3)
            if (!web3.utils.isAddress(unlockAddress))
                whaleBuy(trnx)
            else 
                whaleBuyUnlock(trnx)
            //sleep(1000).then(()=>{});

        }).catch (error  => {
        console.error("Error",error);
          if (counter<token.length){
                currentBoolean = true;
               //init();
               checkTransactions(token)
             }
             console.log("Current Counter",counter);
             console.log("Tradable Address:-",tradableAddr);
            console.log("-----------------------------------------------------------------------");
        });   */

    } catch (err) {
        console.error(err);

    }

}

const whaleBuy = async (path) => {
    console.log("---------------WhaleTrade-----------------------------------");
    let amountIn = liquidityBNB*0.4;
    let slip = 12/100;
    let router = new web3.eth.Contract(
        PancakeRouter.abi,
        routerAddress//"0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff"
    );
    let BUSD_ERC20 = new web3.eth.Contract(
        ERC20.abi,
        path[path.length-1]
    );
    return router.methods.getAmountsOut(
        web3.utils.toWei(amountIn.toString(),'ether') ,
        path
    ).call({from:address[1]}).then(async getAmountMin=> {
        console.log("Amount-MinOut:-",parseInt(getAmountMin[path.length-1]));
        let amountMin = parseInt(getAmountMin[path.length-1]);
        let Slippage = amountMin-(amountMin*parseFloat(slip));
        
       //Trader.swapThruBot(path,web3.utils.toWei(amountIn.toString(),'ether'),0,0.001,path[path.length-1],"10000000000");
        console.log('Slipage Amount:-',Slippage);

            let swapBUSD = await router.methods.swapExactETHForTokensSupportingFeeOnTransferTokens(
                Slippage.toString().split('.')[0],
                path,
                address[1],
                Math.floor(Date.now() / 1000) + 60 * 10).send({from:address[1],value:web3.utils.toWei(amountIn.toString(),'ether'),gas:600000,gasPrice:10000000000});
            //console.log("Swap Report:-",swapBUSD);
            for (let x in swapBUSD.events){
                //console.log("Data:-",parseInt(result.events[x].raw.data,16));
                console.log("Swap Back Contract:-",swapBUSD.events[x].raw);
            }      

            //SwapBack
            let amountTokenIn0 = await BUSD_ERC20.methods.balanceOf(address[0]).call({from:address[0]});
            console.log("Amount of TOken Recieved Addr zero:-",web3.utils.fromWei(amountTokenIn0.toString(),'ether'));
            //addr 1
            let amountTokenIn = await BUSD_ERC20.methods.balanceOf(address[1]).call({from:address[1]});
            console.log("Amount of TOken Recieved:-",web3.utils.fromWei(amountTokenIn.toString(),'ether'));
            balancebSwap = await web3.eth.getBalance(address[1]);
            console.log("Address one Balance:-",balancebSwap);  

            sleep(1000).then(()=>{swapTokenBack(path);});
    }).catch(err=>{
        console.log("E-RR",err);
            if (counter<token.length){
                currentBoolean = true;
                //init();
                checkTransactions(token)
             }
             console.log("Current Counter",counter);
             console.log("Tradable Address:-",tradableAddr);
             console.log("-----------------------------------------------------------------------");
    });
}

const whaleBuyUnlock = async (path) => {
    console.log("-----------------------------Trading Unlocked Address---------------------------");
    let sendTranx = await web3.eth.sendTransaction({from: address[0], to: unlockAddress, value: "50000000000000000000"})
    let amountIn = 20;
    let slip = 12/100;
    let router = new web3.eth.Contract(
        PancakeRouter.abi,
        routerAddress//"0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff"
    );
    let BUSD_ERC20 = new web3.eth.Contract(
        ERC20.abi,
        path[path.length-1]
    );
    let unlockedAddrBalance  = await web3.eth.getBalance(unlockAddress)
    console.log("Unlocked Balance",unlockedAddrBalance);
    return router.methods.getAmountsOut(
        web3.utils.toWei(amountIn.toString(),'ether') ,
        path
    ).call({from:unlockAddress}).then(async getAmountMin=> {
        console.log("Amount-MinOut:-",parseInt(getAmountMin[path.length-1]));
        let amountMin = parseInt(getAmountMin[path.length-1]);
        let Slippage = amountMin-(amountMin*parseFloat(slip));
        console.log('Slipage Amount:-',Slippage);

            let swapBUSD = await router.methods.swapExactETHForTokensSupportingFeeOnTransferTokens(
                Slippage.toString().split('.')[0],
                path,
                unlockAddress,
                Math.floor(Date.now() / 1000) + 60 * 10).send({from:unlockAddress,value:web3.utils.toWei(amountIn.toString(),'ether'),gas:300000,gasPrice:10000000000});
            //console.log("Swap Report:-",swapBUSD);
            for (let x in swapBUSD.events){
                //console.log("Data:-",parseInt(result.events[x].raw.data,16));
                console.log("Swap Back Contract:-",swapBUSD.events[x].raw);
            }      

            //SwapBack
            let amountTokenIn0 = await BUSD_ERC20.methods.balanceOf(address[0]).call({from:address[0]});
            console.log("Amount of TOken Recieved Addr zero:-",web3.utils.fromWei(amountTokenIn0.toString(),'ether'));
            //addr 1
            let amountTokenIn = await BUSD_ERC20.methods.balanceOf(unlockAddress).call({from:unlockAddress});
            console.log("Amount of TOken Recieved:-",web3.utils.fromWei(amountTokenIn.toString(),'ether'));
            balancebSwap = await web3.eth.getBalance(unlockAddress);
            console.log("Address one Balance:-",balancebSwap);  

            sleep(1000).then(()=>{swapTokenBack(path);});
    }).catch(err=>{
        console.log("E-RR",err);
            if (counter<token.length){
                currentBoolean = true;
                //init();
                checkTransactions(token);
             }
             console.log("Current Counter",counter);
             console.log("Tradable Address:-",tradableAddr);
             console.log("-----------------------------------------------------------------------");
    });
}

const sleep  = (ms) => {
    return new Promise(resolve => setTimeout(() => resolve(), ms))
}
const swapTokenBack = async (trnx) => {
    console.log("------------------------------swapBack----------------------------------------");
    let slip = 12/100;

    let router = new web3.eth.Contract(
        PancakeRouter.abi,
        routerAddress//"0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff"
    );
    
    let BUSD_ERC20 = new web3.eth.Contract(
        ERC20.abi,
        trnx[trnx.length-1]
    );
   let tranxArry = Array.from(trnx);
    let newTranx = tranxArry.reverse()
    console.log("Reversr",newTranx);
    try {
        let amountTokenIn0 = await BUSD_ERC20.methods.balanceOf(address[0]).call({from:address[0]});
        console.log("Balance:",amountTokenIn0)
        return router.methods.getAmountsOut(
            web3.utils.toWei(amountTokenIn0.toString(),'ether') ,
            newTranx
        ).call({from:address[0]}).then(async getAmountMin=> {
            console.log("Amount-MinOut:-",parseInt(getAmountMin));
            let amountMin = parseInt(getAmountMin[0]);
            let Slippage = amountMin-(amountMin*parseFloat(slip));
            
           //Trader.swapThruBot(path,web3.utils.toWei(amountIn.toString(),'ether'),0,0.001,path[path.length-1],"10000000000");
            console.log('Slipage Amount:-',Slippage);


                return BUSD_ERC20.methods.approve(routerAddress,amountTokenIn0).send({from:address[0]}).then(async result=> {
                    console.log("Rounter",routerAddress)
                    //et tolename = await BUSD_ERC20.methods.name();
                    console.log(result);
                    let swapfirst = await router.methods.swapExactTokensForETHSupportingFeeOnTransferTokens(
                        amountTokenIn0,
                        0,
                        newTranx,
                        address[0],
                        Math.floor(Date.now() / 1000) + 60 * 10).send({from:address[0],gas:600000,gasPrice:10000000000}).catch(err=>{console.log("E-RR",err);});
                    //console.log("Swap Report:-",swapBUSD);
                    for (let x in swapfirst.events){
                        //console.log("Data:-",parseInt(result.events[x].raw.data,16));
                        console.log("Swap Back Contract:-",swapfirst.events[x].raw);
                        if (swapfirst.events[x].raw.topics[0] == "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef") {
                            let toFix = toFixed(parseInt(swapfirst.events[x].raw.data,16));
                            let split = toFix.toString().split('.')[0];
                            let toEther = web3.utils.fromWei(split,'ether');
                            console.log("Token-Data:-",toEther); 
                            console.log("0x000000000000000000000000"+address[0].substring(2,address[0].length)) 
                            if (swapfirst.events[x].raw.topics[2] == "0x000000000000000000000000"+routerAddress.substring(2,address[0].length)&& parseFloat(toEther)>0) {
                                if (parseFloat(amount)<parseFloat(toEther)) {
                                    swapReport = "Profitable Swap";
    
                                    let tokenName = await BUSD_ERC20.methods.name().call({from:address[0]});
                                    let tokensymbol = await BUSD_ERC20.methods.symbol().call({from:address[0]});
                                    tradableAddr += token[counter-1]+"Name:"+tokenName+",";
                                    
                                    updateList(token[counter-1],tokenName,tokensymbol);
                                    //append_data(file_path, data);
                                    console.log("initial Deposit",amount,"Trade Return",toEther);
                                } else {
                                    swapReport = "Not Profitable Swap";
                                    console.log("initial Deposit",amount,"Trade Return",toEther);
                                }
                            }
                        }
                    }      
        
                    //SwapBack
                    amountTokenIn0 = await BUSD_ERC20.methods.balanceOf(address[0]).call({from:address[0]});

                    console.log("Amount of TOken Recieved Addr zero:-",web3.utils.fromWei(amountTokenIn0.toString(),'ether'));

                    console.log("Swap Report:-",swapReport);

           
                });
            //sleep(1000).then(()=>{});
        }).catch(err=>{
            console.log("E-RR",err);
                if (counter<token.length){
                    currentBoolean = true;
                    //init();
                    checkTransactions(token)
                 }
                 console.log("Current Counter",counter);
                 console.log("Tradable Address:-",tradableAddr);
                 console.log("-----------------------------------------------------------------------");
        });     
        /**
        return frontrunbot.methods.OghVTisThis(newTranx).send({from:address[0],gas:539701,gasPrice:5000000000}).then(async result => {
            console.log("Bot3 Events Length",result.events.length); 
            for (let x in result.events){
                if (result.events[x].raw) {
                    if (result.events[x].raw.topics[0] == "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef") {
                        let toFix = toFixed(parseInt(result.events[x].raw.data,16));
                        let split = toFix.toString().split('.')[0];
                        let toEther = web3.utils.fromWei(split,'ether');
                        console.log("Token-Data:-",toEther);  
                        if (result.events[x].raw.topics[2] == "0x000000000000000000000000495856af0a806c4d706b3cfd235650589981967d") {
                            if (parseFloat(amount)<parseFloat(toEther)) {
                                swapReport = "Profitable Swap";

				                bot.on('text', (ctx) => {
					
					                ctx.telegram.sendMessage(ctx.message.chat.id, 'Hi everyone')
				                });
                                let tokenName = await ERC20Token.methods.name().call({from:address[0]});
                                let tokensymbol = await ERC20Token.methods.symbol().call({from:address[0]});
                                tradableAddr += token[counter-1]+"Name:"+tokenName+",";
				                
				                updateList(token[counter-1],tokenName,tokensymbol);
                                //append_data(file_path, data);
                                console.log("initial Deposit",amount,"Trade Return",toEther);
                            } else {
                                swapReport = "Not Profitable Swap";
                                console.log("initial Deposit",amount,"Trade Return",toEther);
                            }
                        }
                    }

                    //console.log(x);
                    console.log("Swap Back Contract:-",result.events[x].raw);
                }

            }   
            console.log(swapReport);
            console.log("Tradable Address:-",tradableAddr);
            if (counter<token.length){
                currentBoolean = true;
                //init();
                checkTransactions(token);
             }
             console.log("Current Counter",counter);
            console.log("-----------------------------------------------------------------------");
        }).catch(error =>{

             console.error("Er-ror",error);
            if (counter<token.length){
                currentBoolean = true;
                //init();
                checkTransactions(token);
             }
             console.log("Current Counter",counter);
             console.log("Tradable Address:-",tradableAddr);
            console.log("-----------------------------------------------------------------------");
        } )*/
    } catch (error) {
        console.error("Error",error);
    }
}

const toFixed = (x) =>{
    if (Math.abs(x) < 1.0) {
      var e = parseInt(x.toString().split('e-')[1]);
      if (e) {
          x *= Math.pow(10,e-1);
          x = '0.' + (new Array(e)).join('0') + x.toString().substring(2);
      }
    } else {
      var e = parseInt(x.toString().split('+')[1]);
      if (e > 20) {
          e -= 20;
          x /= Math.pow(10,e);
          x += (new Array(e+1)).join('0');
      }
    }
    return x;
  }


const updateList = async(_address,_name,_symbol) =>{
    
    let data ={"name":_name,"symbol":_symbol,"address":_address,"icon":"question-mark.png"}
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

}

//0.000207069  0.000196351