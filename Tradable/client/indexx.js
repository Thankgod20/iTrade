const Web3 = require('web3');
const ganache = require("ganache");
const HDWalletProvider = require('@truffle/hdwallet-provider');
const prompt = require('prompt');
const WETH = require("../build/contract/WETH.json");
const PancakeRouter = require("../build/contract/pancakeRouter.json");
const FrontRunBot = require("../build/contract/FrontRunBot.json");
const mnemonic = require("../secrets.json").mnemonic;
const ERC20 = require("../build/contract/ERC20.json");
const BN = require("bn.js");

const options = {"fork":"https://bsc.getblock.io/mainnet/?api_key=3a7a0d72-40df-4821-9250-14e0495414bb"}//{"fork":"https://speedy-nodes-nyc.moralis.io/346380c8eca1a345a08fbdc8/bsc/mainnet"};
const provider = ganache.provider(options);

const web3 = new Web3(provider);
let FrontRunBotAddr ="0xD15DeD429E7d04cC49488469916f36D958a0E6eD";//"0x618ffF1BA08Ac2c5A53fCC1FDeD636D02D99705D";//"0x193263e1103207Fba4fEDfADD4d98DB4D205a7eD";//"0x2Ee5578367FF53F844d896EEb246B2E183Dd5627";//"0x0a553c182c757876680D8Dc223c0cE5bcBcCfBf7";

let address = null;
let balance = null;

prompt.start();
let amount = null;
let token = null;
let slipAmount = null
let tradeOptions = null;
let swapReport = null;
let tradableAddr = null;
let counter = 0;
let boolen = true;
prompt.get(['amount', 'path','slip'], function (err, result) {

    if (err) {
      return onErr(err);
    }
    console.log('Command-line input received:');
    amount = parseFloat(result.amount);
    console.log('  amount: ' + amount);
    token = result.path;
    console.log('  path: ' + token);
    slipAmount = parseFloat(result.slip)/100;
    console.log("Slippage:-",slipAmount)
    tradeOptions = result.trade;
    
    init();
  });
  
  function onErr(err) {
    console.log(err);
    return 1;
  }
const init = async() => {
    let wbnb = "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c";//"0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";
    let bether = "0x8babbb98678facc7342735486c851abd7a0d17ca";
    let usdt = "0x7ef95a0fee0dd31b22626fa2e10ee6a223f8a684";

    address = await web3.eth.getAccounts();
    console.log(address);
    balance = await web3.eth.getBalance(address[0]);
    console.log("Address one Balance:-",balance);    
    //WBNB balance
    const weth_contract = new web3.eth.Contract(
        WETH.abi,
        wbnb
    );
    const weth_totalBalance = await weth_contract.methods.totalSupply().call({from:address[0]});
    console.log("Weth Balance:-",weth_totalBalance);

    swapToken(amount,[wbnb,token]);
      
       
   
    
    

}
const swapToken = async (amountIn,trnx) => {
    console.log("Address:-",address[0]);
    let frontrunbot = new web3.eth.Contract(
        FrontRunBot.abi,
        FrontRunBotAddr
    ); 
   // console.log("Router:-",router.methods.getAmountsOut());
    try {
        return frontrunbot.methods.initFrontRunTrnx(trnx,"1000000000000000",0,web3.utils.toWei(amountIn.toString(),'ether')).send({from:address[0],gas:500000,gasPrice:5000000000}).then(async result => {
            //console.log(result);
            for (let x in result.events.log) {

                console.log("FlashLoan Report:-",result.events.log[x].returnValues.message,"Value:-",result.events.log[x].returnValues.val.toString()); 

            } 
            whaleBuy(trnx)
            //sleep(1000).then(()=>{});
            
        }).catch (error  => {
        console.error("Error",error);

        });   

    } catch (err) {
        console.error(err);
        
    }

}


const whaleBuy = async (path) => {
    let amountIn = 10;
    let slip = 12/100;
    let router = new web3.eth.Contract(
        PancakeRouter.abi,
        "0x10ED43C718714eb63d5aA57B78B54704E256024E"
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
        console.log('Slipage Amount:-',Slippage);
        
            let swapBUSD = await router.methods.swapExactETHForTokensSupportingFeeOnTransferTokens(
                Slippage.toString().split('.')[0],
                path,
                address[1],
                Math.floor(Date.now() / 1000) + 60 * 10).send({from:address[1],value:web3.utils.toWei(amountIn.toString(),'ether'),gas:300000,gasPrice:10000000000});
            //console.log("Swap Report:-",swapBUSD);
            for (let x in swapBUSD.events){
                //console.log("Data:-",parseInt(result.events[x].raw.data,16));
                console.log("Swap Back Contract:-",swapBUSD.events[x].raw);
            }      

            //SwapBack
            let amountTokenIn0 = await BUSD_ERC20.methods.balanceOf(FrontRunBotAddr).call({from:address[0]});
            console.log("Amount of TOken Recieved Addr zero:-",web3.utils.fromWei(amountTokenIn0.toString(),'ether'));
            //addr 1
            let amountTokenIn = await BUSD_ERC20.methods.balanceOf(address[1]).call({from:address[1]});
            console.log("Amount of TOken Recieved:-",web3.utils.fromWei(amountTokenIn.toString(),'ether'));
            balancebSwap = await web3.eth.getBalance(address[1]);
            console.log("Address one Balance:-",balancebSwap);  

            sleep(1000).then(()=>{swapTokenBack(path);});
    }).catch(err=>{
        console.log("E-RR",err);
    });
}

const sleep  = (ms) => {
    return new Promise(resolve => setTimeout(() => resolve(), ms))
}
const swapTokenBack = async (trnx) => {

    let frontrunbot = new web3.eth.Contract(
        FrontRunBot.abi,
        FrontRunBotAddr
    );
    let tranxArry = Array.from(trnx);
    let newTranx = tranxArry.reverse()
    console.log("Reversr",newTranx);
    try {
        return frontrunbot.methods.swapBack(newTranx).send({from:address[0],gas:539701,gasPrice:5000000000}).then(async result => {
            console.log("Bot3 Events Length",result.events.length); 
            for (let x in result.events){
                if (result.events[x].raw) {
                    if (result.events[x].raw.topics[0] == "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef") {
                        let toFix = toFixed(parseInt(result.events[x].raw.data,16));
                        let split = toFix.toString().split('.')[0];
                        let toEther = web3.utils.fromWei(split,'ether');
                        console.log("Token-Data:-",toEther);  
                        if (result.events[x].raw.topics[2] == "0x000000000000000000000000d15ded429e7d04cc49488469916f36d958a0e6ed") {
                            if (parseFloat(amount)<parseFloat(toEther)) {
                                swapReport = "Profitable Swap";
                                 tradableAddr += newTranx[0];
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
            console.log("Tradable Address:-", tradableAddr);
            
        }).catch(error =>{
            console.error("Er-ror",error);
            
        } )
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