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

var provider = provider = new HDWalletProvider(mnemonic, "https://speedy-nodes-nyc.moralis.io/346380c8eca1a345a08fbdc8/bsc/mainnet");

const web3 = new Web3(provider);
let FrontRunBotAddr ="0xD15DeD429E7d04cC49488469916f36D958a0E6eD";//"0x618ffF1BA08Ac2c5A53fCC1FDeD636D02D99705D";//"0x193263e1103207Fba4fEDfADD4d98DB4D205a7eD";//"0x2Ee5578367FF53F844d896EEb246B2E183Dd5627";//"0x0a553c182c757876680D8Dc223c0cE5bcBcCfBf7";

let address = null;
let balance = null;

prompt.start();
let amount = null;
let token = null;
let slipAmount = null
let tradeOptions = null;
prompt.get(['amount', 'path','slip','trade'], function (err, result) {

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
    console.log("Trade:-",parseInt(tradeOptions)==1?"Buy":"Sell")
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
    if (parseInt(tradeOptions)==1)
       swapToken(amount,[wbnb,token]);
    else
        swapTokenBack([wbnb,token]);
        

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
            
            for (let x in result.events.log) {

                console.log("FlashLoan Report:-",result.events.log[x].returnValues.message,"Value:-",result.events.log[x].returnValues.val.toString()); 

            }      
        }).catch (error  => {
        console.error("Error",error);

        });   

    } catch (err) {
        console.error(err);
        
    }

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
            console.log("Bot3 Rsult",result);    
        }).catch(error =>{
            console.error("Er-ror",error);
        } )
    } catch (error) {
        console.error("Error",error);
        
    }
}