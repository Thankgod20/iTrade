const Web3 = require('web3');
const ganache = require("ganache");
const HDWalletProvider = require('@truffle/hdwallet-provider');
const prompt = require('prompt');
const WETH = require("../build/contract/WETH.json");
const PancakeRouter = require("../build/contract/pancakeRouter.json");
const PancakeFactory = require("../build/contract/pancakeFactory.json");
const FrontRunBot = require("../build/contract/FrontRunBotz.json");
const mnemonic = require("../secrets.json").mnemonic;
const ERC20 = require("../build/contract/ERC20.json");
const BN = require("bn.js");
var request = require('request');
const fs = require('fs');
const file_path = './address.json';
const { Telegraf } = require('telegraf');
const statusReport = require('./status.js');


const bot = new Telegraf("5164100242:AAHXl8hxW9wYkLSRtY3tx8FsOKBBz7viziw");


let FrontRunBotAddr ="0x495856af0A806c4d706B3cFD235650589981967d";//"0xD15DeD429E7d04cC49488469916f36D958a0E6eD";//"0x618ffF1BA08Ac2c5A53fCC1FDeD636D02D99705D";//"0x193263e1103207Fba4fEDfADD4d98DB4>





prompt.start();

let tradeOptions = null;

let currentBoolean = true;

let passState = null;
let addressInclued = null;


class Tradable {
    constructor() {
       this.socket = null;
       this.io = null;

       this.room = null;
       this.address = null;
       this.balance = null;
       this.options = null;
       this.provider = null;
       this.web3 = null;
       this.unlockAddress = null;

       let amount = null;
       this.token = null;
       this.slipAmount = null
       this.tradableAddr = "null,";
       this.swapReport = null;
       this.counter = 0;
       this.liquidityBNB = null

       this.unKnownID = 0;
       this.unlockedAddressList = [];
       this.addressInclued = null;
       this.routerAddress = null;
        /*
        this.options = null;//{"fork":"https://bsc.getblock.io/mainnet/?ap>
        this.provider = null;
        this.web3 = null;*/

    }
    main(_amount,path,slip,liquidity,io_,socket_,msg_) {
        
        
        const initiate = async(_amount,path,slip,liquidity,io_,socket_,msg_) => {
                return new Promise((resolve,reject)=>{
                    this.io = io_;
                    this.socket = socket_;
                    this.room = msg_;
                    this.io.sockets.in(this.room).emit('private', "initiating**");
                    this.unlockAddress = null;
                    console.log('Command-line input received:');
                    this.amount = _amount;
                    console.log('  amount: ' + this.amount);
                    let tokenAddr = path;
                    this.token = Array.from(tokenAddr.split(','));
                    console.log('  path: ', this.token);
                    this.slipAmount = parseFloat(slip)/100;
                    
                    console.log("Slippage:-",this.slipAmount)

                    this.liquidityBNB = parseFloat(liquidity);
                    console.log("Liquidity:-",this.liquidityBNB);
                    this.counter = 0;
                    
                    currentBoolean = true;

                    checkTransactions(this.token).then(result => {
                            
                            console.log("Report",result);
                            
                            return resolve(result);
                            //console.log("EE3EEE",result);
                    }).catch(error => {
                            console.log("EE3EEE",error);
                            reject(error);
                    });
                });

            }

        const checkTransactions = async (trnx) => {
            return new Promise((resolve,reject)=>{
                this.io.sockets.in(this.room).emit('private', "Checking Token Address");
            try {
                var resolved = "";
                var optionsTrnx = {"fork":"https://matic.getblock.io/mainnet/?api_key=3a7a0d72-40df-4821-9250-14e0495414bb"};
                var providerTrnx = ganache.provider(optionsTrnx);
                var web3Tranx = new Web3(providerTrnx);
                let Contaddress = "";
                request('https://api.polygonscan.com/api?module=account&action=txlist&address='+trnx[0]+'&startblock=0&endblock=99999999&page=1&offset=100&sort=asc&apikey=T1TBH19TFUSP5B7PCND4FA6RAYXQU9F55V', function (error, response, body) {
                console.log('https://api.polygonscan.com/api?module=account&action=txlist&address='+trnx[0]+'&startblock=0&endblock=99999999&page=1&offset=100&sort=asc&apikey=T1TBH19TFUSP5B7PCND4FA6RAYXQU9F55V');
                var contractTrnx = "";
                if (!error && response.statusCode == 200) {

                    contractTrnx = JSON.parse(body);
                    for (let i=1;i<contractTrnx.result.length;i++) {
                        let trxnMethod = contractTrnx.result[i].input!=null?contractTrnx.result[i].input.substring(0,10):"";
                        let approveId = "0x095ea7b3";//Approve
                        let transferId = "0xa9059cbb";//Transfer
                        let burnID = "0x7b47ec1a";//Burn
                        
                        if (trxnMethod != approveId && trxnMethod != transferId && trxnMethod != burnID) {
                            
                            this.unKnownID +=1;
                            
                            console.log("UNknownID:-",this.unKnownID);
                            console.log("result2 : " + contractTrnx.result[i].blockNumber+",Method:-"+trxnMethod+",input:-"+contractTrnx.result[i].input);
                            console.log(contractTrnx.result[i].input!=null?contractTrnx.result[i].input.includes("000000000000000000000000"):false);
                            if (contractTrnx.result[i].input!=null) {
                                if (contractTrnx.result[i].input.includes("000000000000000000000000")) {
                                    //addressInclued = contractTrnx.result[i].input.includes("000000000000000000000000");
                                    let addr = contractTrnx.result[i].input.split('000000000000000000000000');
                                    console.log("Address:-", addr)
                                    for (let i=0; i < addr.length; i++) {
                                        if (web3Tranx.utils.isAddress("0x"+addr[i]) && ("0x"+addr[i]) != trnx[0]) {
                                            this.addressInclued = true;
                                            Contaddress = "0x"+addr[i];
                                            // checkContractAddr(Contaddress,web3Tranx);
                                        }                        
                                    }
                                } 
                            }
                        } 
                    }
                    if (this.unKnownID == 0) {
                        init("") .then (result => {
                            resolved = result;
                            statusReport.status=(200);
                            return resolve(resolved);
                            console.log("EEE4EE",result);
                    }).catch(error => {
                    
                            reject(error);
                        });
                    } else if (!this.addressInclued) {
                    
                        init("").then (result => {
                            resolved = result;
                            statusReport.status=(200);
                            return resolve(resolved);
                            console.log("EEE4EE",result);
                        }).catch(error => {
                    
                            reject(error);
                        });
                    } else {
                        checkContractAddr(Contaddress,web3Tranx).then (result => {
                            console.log("EEcEEE",result);
                            statusReport.status=(300);
                            return resolve(result);
                        }).catch(error => {

                            reject(error);
                        });
                    }

                    //
                } else {
                    console.log("Error");
                    reject("Error: Connection Error");
                }
            });
            } catch (err) {
                console.log("ErrorCheckCOnq",error);
                reject("Error: Connection Error");
            }
            
            });
            }
        const checkContractAddr = async(Caddress,web3Tranx) => {
            return new Promise(async(resolve,reject)=>{
                this.io.sockets.in(this.room).emit('private', "Checking Token nested Address");
            try {
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
                                            this.unlockedAddressList.push(Contaddress)
                                            console.log("Address:-",this.unlockedAddressList);


                                        }
                                    } 
                                    //return resolve("result");                
                                    if (this.unlockedAddressList.length>1) {
                                        if (this.unlockedAddressList[1] != this.token[this.counter]) {
                                            this.unlockAddress = this.unlockedAddressList[1];
                                            init(this.unlockedAddressList[1]).then(result => {
                                                return resolve(result);
                                                console.log("E45EEE",result);
                                            }).catch(error => {
                            
                                                reject(error);
                                            });
                                        } else {
                                            this.unlockAddress = this.unlockedAddressList[0];
                                            init(this.unlockedAddressList[0]).then(result => {
                                                return resolve(result);
                                                console.log("E45EEE",result);
                                            }).catch(error => {
                            
                                                reject(error);
                                            });
                                        }
                                        
                                    } else { 
                                            reject("Malicious Contract");
      
                                    }   
                                } else {
                                                                
                                        reject("Malicious Contract");
             
                            
                                }
                            }catch (error) {
                            
                                    reject("Malicious Contract");
                                	
                            }
                    } else {
                    console.log("Error");
                    reject("Error: Connection Layer two Error");
                }
                });
            }catch (error) {
                console.log("ErrorCheckCTwo",error);
                reject("Error: Connection Layer two Error");
            }
            });
            }
        let init = async(unlockAddress) => {
            return new Promise(async(resolve,reject)=>{
                this.io.sockets.in(this.room).emit('private', "Setting Transaction Mode");
            try {
                if (unlockAddress != "") {
                    
                    this.options = {"fork":"https://matic.getblock.io/mainnet/?api_key=3a7a0d72-40df-4821-9250-14e0495414bb","wallet":{"unlockedAccounts":[unlockAddress.toString()]}};
                    console.log("Using UnlockedAddr")
                }
                else{
                    this.options = {"fork":"https://matic.getblock.io/mainnet/?api_key=3a7a0d72-40df-4821-9250-14e0495414bb"}; 
                    console.log("Using Normal Test")
                }
                this.provider = ganache.provider(this.options);
                this.web3 = new Web3(this.provider);

                let wbnb = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";//"0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";
                let usdc = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
                let usdt = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";

                this.address = await this.web3.eth.getAccounts();
                console.log(this.address,this.room);
                this.balance = await this.web3.eth.getBalance(this.address[0]);
                console.log("Address one Balance:-",this.balance,"Room:-",this.room);    
                //WBNB balance
                const weth_contract = new this.web3.eth.Contract(
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
                console.log("tokenZero",this.token[this.counter]);
                let found = false;
                for (let i = 0; i <dex.length;i++){
                    let factory = new this.web3.eth.Contract(
                        PancakeFactory.abi,
                        dex[i]
                    );
                    for (let j = 0; j< fiat.length;j++) {
                        let pair = await factory.methods.getPair(fiat[j],this.token[this.counter]).call({from:this.address[0]}).catch(err=>{console.log(err)});
                        if (pair != "0x0000000000000000000000000000000000000000") {
                            if (fiat[j] == wbnb) 
                                thepath = [wbnb,this.token[this.counter]];
                            else
                                thepath = [wbnb,fiat[j],this.token[this.counter]];
                             
                            this.routerAddress = dex[i]==sushiFactory?sushiRouter:quickswapRouter;
                            console.log("Path",thepath)
                            console.log("Pair",pair)
                            console.log("RouterAddress",this.routerAddress)
                            found = true;
                            break;
                        }
                    }
            
                    if (found) {
                        break;
                    }
                    
                }
                const weth_totalBalance = await weth_contract.methods.totalSupply().call({from:this.address[0]});
                
                console.log("Weth Balance:-",weth_totalBalance);
                console.log("Current Counter",this.counter);
                //while(currentBoolean) {
                    swapToken(this.amount,thepath).then(result => {
                        return resolve(result);
                    }).catch(error => {
                    
                        reject(error);
                    });
                    currentBoolean = false;
                    if (this.counter<this.token.length)
                        this.counter=0;
            // }
                } catch (error) {
                        console.log("ErrorInit",error);
                        reject(error);
                }
            }); 

            }


        const swapToken = async (amountIn,path) => {
            return new Promise(async(resolve,reject)=>{
                this.io.sockets.in(this.room).emit('private', "Swap 1 of 3");
                console.log("Address:-",this.address[0],"RoOM:-",this.room);
                let frontrunbot = new this.web3.eth.Contract(
                    FrontRunBot.abi,
                    FrontRunBotAddr
                ); 
                let slip = 12/100;
                let router = new this.web3.eth.Contract(
                    PancakeRouter.abi,
                    this.routerAddress//"0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff"
                );
                let BUSD_ERC20 = new this.web3.eth.Contract(
                    ERC20.abi,
                    path[path.length-1]
                );
            // console.log("Router:-",router.methods.getAmountsOut());
                try {
                    return router.methods.getAmountsOut(
                        this.web3.utils.toWei(amountIn.toString(),'ether') ,
                        path
                    ).call({from:this.address[0]}).then(async getAmountMin=> {
                        console.log("Amount-MinOut:-",parseInt(getAmountMin[path.length-1]));
                        let amountMin = parseInt(getAmountMin[path.length-1]);
                        let Slippage = amountMin-(amountMin*parseFloat(slip));
                        
                       //Trader.swapThruBot(path,web3.utils.toWei(amountIn.toString(),'ether'),0,0.001,path[path.length-1],"10000000000");
                        console.log('Slipage Amount:-',Slippage);
                
                            let swapfirst = await router.methods.swapExactETHForTokensSupportingFeeOnTransferTokens(
                                Slippage.toString().split('.')[0],
                                path,
                                this.address[0],
                                Math.floor(Date.now() / 1000) + 60 * 10).send({from:this.address[0],value:this.web3.utils.toWei(amountIn.toString(),'ether'),gas:600000,gasPrice:10000000000}).catch(err=>{console.log("E-RR",err);reject("Error: Initial Swap Error");});;
                            //console.log("Swap Report:-",swapBUSD);
                            for (let x in swapfirst.events){
                                //console.log("Data:-",parseInt(result.events[x].raw.data,16));
                                console.log("Swap Back Contract:-",swapfirst.events[x].raw);
                            }      
                
                            //SwapBack
                            let amountTokenIn0 = await BUSD_ERC20.methods.balanceOf(this.address[0]).call({from:this.address[0]});
                            console.log("Amount of TOken Recieved Addr zero:-",this.web3.utils.fromWei(amountTokenIn0.toString(),'ether'));
                       
                
                            if (!this.web3.utils.isAddress(this.unlockAddress))
                                whaleBuy(path).then (result => {
                                    return resolve(result)
                                }).catch(error => {
                                    console.log("swapto"+error);
                                    reject(error);
                                });
                            else 
                                whaleBuyUnlock(path).then (result => {
                                    return resolve(result);
                                }).catch(error => {
                                    console.log("swapto"+error);
                                    reject(error);
                                });
                        //sleep(1000).then(()=>{});
                    }).catch(err=>{
                        console.log("E-RR",err);
                            if (this.counter<this.token.length){
                                currentBoolean = true;
                                //init();
                                //checkTransactions(this.token)
                             }
                             console.log("Current Counter",this.counter);
                             console.log("Tradable Address:-",this.tradableAddr);
                             console.log("-----------------------------------------------------------------------");
                             reject("Error: Initial Swap Error");
                    });   
                    /** 
                    frontrunbot.methods.thisIsOghVT(trnx,"1000000000000000",0,this.web3.utils.toWei('0.001','ether')).send({from:this.address[0],gas:5000000,gasPrice:5000000000}).then(async result => {
                        //console.log(result);
                        for (let x in result.events){
                            if (result.events[x].raw) {
                                if (result.events[x].raw.topics[0] == "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef") {
                                    let toFix = toFixed(parseInt(result.events[x].raw.data,16));
                                    let split = toFix.toString().split('.')[0];
                                    let toEther = this.web3.utils.fromWei(split,'ether');
                                    console.log("Token-Data:-",toEther);  
                                    }
                                }
                        console.log("Swap Back Contract:-",result.events[x].raw);
                        
                    }
                        for (let x in result.events.log) {

                            console.log("FlashLoan Report:-",result.events.log[x].returnValues.message,"Value:-",result.events.log[x].returnValues.val.toString()); 

                        } 
                        
                        if (!this.web3.utils.isAddress(this.unlockAddress)) {
                            whaleBuy(trnx).then (result => {
                                return resolve(result)
                            }).catch(error => {
                                console.log("swapto"+error);
                                reject(error);
                            });
                        }else {
                            whaleBuyUnlock(trnx).then (result => {
                                return resolve(result);
                            }).catch(error => {
                                console.log("swapto"+error);
                                reject(error);
                            });
                        //sleep(1000).then(()=>{});
                        }
                    }).catch (error  => {
                    console.error("Error",error);
                    if (this.counter<this.token.length){
                            currentBoolean = true;
                        //init();
                       // checkTransactions(this.token)
                        }
                        console.log("Current Counter",this.counter);
                        console.log("Tradable Address:-",this.tradableAddr);
                        console.log("-----------------------------------------------------------------------");
                        reject("Error: Initial Swap Error");
                    });   */

                } catch (err) {
                    console.error("Swap error",err);
                    reject("Error: Initial Swap Error");

                }
            });
            }

        const whaleBuy = async (path) => {
            return new Promise(async(resolve,reject)=>{
                console.log("---------------WhaleTrade-----------------------------------");
                this.io.sockets.in(this.room).emit('private', "Swap 2 of 3");
                let amountIn = this.liquidityBNB*0.4;
                let slip = 12/100;
                let router = new this.web3.eth.Contract(
                    PancakeRouter.abi,
                    this.routerAddress//"0x10ED43C718714eb63d5aA57B78B54704E256024E"
                );
                let BUSD_ERC20 = new this.web3.eth.Contract(
                    ERC20.abi,
                    path[path.length-1]
                );
                return router.methods.getAmountsOut(
                    this.web3.utils.toWei(amountIn.toString(),'ether') ,
                    path
                ).call({from:this.address[1]}).then(async getAmountMin=> {
                    console.log("Amount-MinOut:-",parseInt(getAmountMin[path.length-1]));
                    let amountMin = parseInt(getAmountMin[path.length-1]);
                    let Slippage = amountMin-(amountMin*parseFloat(slip));
                    console.log('Slipage Amount:-',Slippage);

                        let swapBUSD = await router.methods.swapExactETHForTokensSupportingFeeOnTransferTokens(
                            Slippage.toString().split('.')[0],
                            path,
                            this.address[1],
                            Math.floor(Date.now() / 1000) + 60 * 10).send({from:this.address[1],value:this.web3.utils.toWei(amountIn.toString(),'ether'),gas:300000,gasPrice:10000000000}).catch(err=>{console.log("E-RR",err);reject("Error: Whale swap unsuccessful");});
                        //console.log("Swap Report:-",swapBUSD);
                        for (let x in swapBUSD.events){
                            //console.log("Data:-",parseInt(result.events[x].raw.data,16));
                            console.log("Swap Back Contract:-",swapBUSD.events[x].raw);
                        }      

                        //SwapBack
                        let amountTokenIn0 = await BUSD_ERC20.methods.balanceOf(FrontRunBotAddr).call({from:this.address[0]});
                        console.log("Amount of TOken Recieved Addr zero:-",this.web3.utils.fromWei(amountTokenIn0.toString(),'ether'));
                        //addr 1
                        let amountTokenIn = await BUSD_ERC20.methods.balanceOf(this.address[1]).call({from:this.address[1]});
                        console.log("Amount of TOken Recieved:-",this.web3.utils.fromWei(amountTokenIn.toString(),'ether'));
                        let balancebSwap = await this.web3.eth.getBalance(this.address[1]);
                        console.log("Address one Balance:-",balancebSwap);  
                        
                        swapTokenBack(path).then (result => {
                            return resolve(result);
                        }).catch(error => {
                            console.log("Wadle"+error);
                            reject(error);
                        });
                        sleep(1000).then(()=>{
                        });
                }).catch(err=>{
                    console.log("E-RR",err);
                        if (this.counter<this.token.length){
                            currentBoolean = true;
                            //init();
                            //checkTransactions(this.token)
                        }
                        console.log("Current Counter",this.counter);
                        console.log("Tradable Address:-",this.tradableAddr);
                        console.log("-----------------------------------------------------------------------");
                        reject("Error: Whale swap unsuccessful");
                });
            });
            }

        const whaleBuyUnlock = async (path) => {
            return new Promise(async(resolve,reject)=>{
                console.log("-----------------------------Trading Unlocked Address---------------------------");
                let sendTranx = await this.web3.eth.sendTransaction({from: this.address[0], to: unlockAddress, value: "50000000000000000000"}).catch(err=>{
                    console.log("E-RRR",err);
                })
                this.io.sockets.in(this.room).emit('private', "Swap 2* of 3");
                let amountIn = 20;
                let slip = 12/100;
                let router = new this.web3.eth.Contract(
                    PancakeRouter.abi,
                    this.routerAddress//"0x10ED43C718714eb63d5aA57B78B54704E256024E"
                );
                let BUSD_ERC20 = new this.web3.eth.Contract(
                    ERC20.abi,
                    path[path.length-1]
                );
                let unlockedAddrBalance  = await this.web3.eth.getBalance(unlockAddress)
                console.log("Unlocked Balance",unlockedAddrBalance);
                return router.methods.getAmountsOut(
                    this.web3.utils.toWei(amountIn.toString(),'ether') ,
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
                            Math.floor(Date.now() / 1000) + 60 * 10).send({from:unlockAddress,value:this.web3.utils.toWei(amountIn.toString(),'ether'),gas:300000,gasPrice:10000000000}).catch(err=>{console.log("E-RR",err);reject("Error: Whale swap unsuccessful or invalided EOA address");});
                        //console.log("Swap Report:-",swapBUSD);
                        for (let x in swapBUSD.events){
                            //console.log("Data:-",parseInt(result.events[x].raw.data,16));
                            console.log("Swap Back Contract:-",swapBUSD.events[x].raw);
                        }      

                        //SwapBack
                        let amountTokenIn0 = await BUSD_ERC20.methods.balanceOf(FrontRunBotAddr).call({from:this.address[0]});
                        console.log("Amount of TOken Recieved Addr zero:-",this.web3.utils.fromWei(amountTokenIn0.toString(),'ether'));
                        //addr 1
                        let amountTokenIn = await BUSD_ERC20.methods.balanceOf(unlockAddress).call({from:unlockAddress});
                        console.log("Amount of TOken Recieved:-",this.web3.utils.fromWei(amountTokenIn.toString(),'ether'));
                        let balancebSwap = await this.web3.eth.getBalance(unlockAddress);
                        console.log("Address one Balance:-",balancebSwap);  

                        swapTokenBack(path).then (result => {
                            return resolve(result);
                        }).catch(error => {
                            console.log("Wahle",error);
                            reject(error);
                        });
                        
                        sleep(1000).then(()=>{
                        });
                }).catch(err=>{
                    console.log("E-RR",err);
                        if (this.counter<this.token.length){
                            currentBoolean = true;
                            //init();
                            //checkTransactions(this.token);
                        }
                        console.log("Current Counter",this.counter);
                        console.log("Tradable Address:-",this.tradableAddr);
                        console.log("-----------------------------------------------------------------------");
                        reject("Error: Whale swap unsuccessful or invalided EOA address");
                });
            });
            }

        const sleep  = (ms) => {
                return new Promise(resolve => setTimeout(() => resolve(), ms))
            }
        const swapTokenBack = async (trnx) => {
            return new Promise(async(resolve,reject)=>{
                console.log("------------------------------swapBack----------------------------------------");
                this.io.sockets.in(this.room).emit('private', "Swap 3 of 3");
                
                try {
                    let frontrunbot = new this.web3.eth.Contract(
                        FrontRunBot.abi,
                        FrontRunBotAddr
                    );
                    let slip = 12/100;
    
                    let router = new this.web3.eth.Contract(
                        PancakeRouter.abi,
                        this.routerAddress//"0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff"
                    );
                    
                    let BUSD_ERC20 = new this.web3.eth.Contract(
                        ERC20.abi,
                        trnx[trnx.length-1]
                    );
                    let tranxArry = Array.from(trnx);
                    let newTranx = tranxArry.reverse()
                    console.log("Reversr",newTranx);

                    let amountTokenIn0 = await BUSD_ERC20.methods.balanceOf(this.address[0]).call({from:this.address[0]});
                    console.log("Balance:",amountTokenIn0)
                    return router.methods.getAmountsOut(
                        this.web3.utils.toWei(amountTokenIn0.toString(),'ether') ,
                        newTranx
                    ).call({from:this.address[0]}).then(async getAmountMin=> {
                        console.log("Amount-MinOut:-",parseInt(getAmountMin));
                        let amountMin = parseInt(getAmountMin[0]);
                        let Slippage = amountMin-(amountMin*parseFloat(slip));
                        
                       //Trader.swapThruBot(path,web3.utils.toWei(amountIn.toString(),'ether'),0,0.001,path[path.length-1],"10000000000");
                        console.log('Slipage Amount:-',Slippage);
            
            
                            return BUSD_ERC20.methods.approve(this.routerAddress,amountTokenIn0).send({from:this.address[0]}).then(async result=> {
                                console.log("Rounter",this.routerAddress)
                                //et tolename = await BUSD_ERC20.methods.name();
                                console.log(result);
                                let swapfirst = await router.methods.swapExactTokensForETHSupportingFeeOnTransferTokens(
                                    amountTokenIn0,
                                    0,
                                    newTranx,
                                    this.address[0],
                                    Math.floor(Date.now() / 1000) + 60 * 10).send({from:this.address[0],gas:600000,gasPrice:10000000000}).catch(err=>{console.log("E-RR",err);reject("Error: Transfer_From_Failed");});
                                //console.log("Swap Report:-",swapBUSD);
                                return resolve(swapfirst.events);
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
            
                                console.log("Amount of TOken Recieved Addr zero:-",this.web3.utils.fromWei(amountTokenIn0.toString(),'ether'));
            
                                console.log("Swap Report:-",swapReport);
            
                       
                            });
                        //sleep(1000).then(()=>{});
                    }).catch(err=>{
                            console.log("E-RR",err);
                            reject("Error: Transfer_From_Failed");
                            if (this.counter<this.token.length){
                                currentBoolean = true;
                                //init();
                                //checkTransactions(token)
                             }
                             console.log("Current Counter",this.counter);
                             console.log("Tradable Address:-",this.tradableAddr);
                             console.log("-----------------------------------------------------------------------");
                    }); 
                    /** 
                    frontrunbot.methods.OghVTisThis(newTranx).send({from:this.address[0],gas:539701,gasPrice:5000000000}).then(async result => {
                         this.io.sockets.in(this.room).emit('private', "Finalizing room of :-"+this.room);
                        console.log("Bot3 Events Length",result.events.length); 
                        return resolve(result.events);
                        for (let x in result.events){
                            if (result.events[x].raw) {
                                if (result.events[x].raw.topics[0] == "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef") {
                                    let toFix = toFixed(parseInt(result.events[x].raw.data,16));
                                    let split = toFix.toString().split('.')[0];
                                    let toEther = web3.utils.fromWei(split,'ether');
                                    console.log("Token-Data:-",toEther);  
                                    if (result.events[x].raw.topics[2] == "0x000000000000000000000000495856af0a806c4d706b3cfd235650589981967d") {
                                        if (parseFloat(this.amount)<parseFloat(toEther)) {
                                            this.swapReport = "Profitable Swap";

                                        bot.on('text', (ctx) => {
                                            
                                            ctx.telegram.sendMessage(ctx.message.chat.id, 'Hi everyone')
                                        });
                                    
                                                        this.tradableAddr += this.token[this.counter-1]+",";
                                        var readJson= await readFile(file_path);
                                    //	console.log(readJson);
                                                        var data = JSON.parse(JSON.stringify(readJson));
                                        data.push({'address':this.token[this.counter-1]});
                        //                                console.log(JSON.stringify(data,null,4));
                                        writeFile(file_path, data);
                                            //append_data(file_path, data);
                                            console.log("initial Deposit",this.amount,"Trade Return",toEther);
                                        } else {
                                            this.swapReport = "Not Profitable Swap";
                                            console.log("initial Deposit",this.amount,"Trade Return",toEther);
                                        }
                                    }
                                }

                                //console.log(x);
                                console.log("Swap Back Contract:-",result.events[x].raw);
                            }

                        }   
                        console.log(this.swapReport);
                        
                        console.log("Tradable Address:-",this.tradableAddr);
                        
                        if (this.counter<this.token.length){
                            currentBoolean = true;
                            //init();
                            checkTransactions(this.token);
                        }
                        console.log("Current Counter",this.counter);
                        console.log("-----------------------------------------------------------------------");
                        
                        
                    }).catch(error =>{

                        //console.error("SwapBaclEr-ror",error);
                        reject("Error: Transfer_From_Failed");
                        //throw new Error("error");
                        if (this.counter<this.token.length){
                            currentBoolean = true;
                            //init();
                            //checkTransactions(this.token);
                        }
                        console.log("Current Counter",this.counter);
                        console.log("Tradable Address:-",this.tradableAddr);
                        console.log("-----------------------------------------------------------------------");
                    } )*/
                } catch (error) {
                    console.error("SwaobackError",error);
                    return resolve(error);
                }
            });
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
            return new Promise(async(resolve,reject)=>{
                initiate(_amount,path,slip,liquidity,io_,socket_,msg_).then(result => {
                    return resolve(result);
                }).catch(err => {
                    reject(err);
                } )
            })
            
    }
}
module.exports = Tradable;
