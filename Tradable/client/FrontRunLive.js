const Web3 = require('web3');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const PancakeRouter = require("../build/contract/pancakeRouter.json");
const mnemonic = require("../secrets.json").mnemonic;
const WETH = require("../build/contract/WETH.json");
const FrontRunBot = require("../build/contract/FrontRunBotz.json");
const ERC20 = require("../build/contract/ERC20.json");

require('dotenv').config();
const ganache = require("ganache");
var amount = null;
var init_reserves = [];
var provider = null;
var web3 = null;
let BUSD = "0x78867bbeef44f2326bf8ddd1941a4439382ef2a7";
let address = null;
let FrontRunBotAddr ="0x495856af0A806c4d706B3cFD235650589981967d";//"0x0a553c182c757876680D8Dc223c0cE5bcBcCfBf7";//"0x65Ca84e73b4C2E94509d1F5a12C6580d5C8B1967";//"0xf6264A65060b3E65FA1fEA3E7fbA618De13B0159";//"0x86E5e0Db98F13192BEEf1D56bf4E87515FCFfA13";//"0x5dc5aCdEc4D4A4eF700938A3Db89d123c2c9c9eE";//"0xbF1811305b9Af3F37ecF7795bD06c5b019616cB6";//"0x9EE1B2428F1e097B3a744A8432Ad5839325916A6";//"0x18392DD904374674F3dba1B72b779aBd4d46e9bB";//"0x036e2Ac7E0b90de453F9782fffe8E12Aaf4FEbDd";//"0xDB8Ec346E84D781C2D620BDEEfd171EfBe8F869a";
let stateChange = 1;
let AccummulatedAmount = 0;
let timerz = 0;
let tradedAddress = null;

//mainnet frontrun bot addr 0x86E5e0Db98F13192BEEf1D56bf4E87515FCFfA13
module.exports.initiate = async() => {
    provider = new HDWalletProvider(mnemonic, process.env.MORALIS_URL);
    web3 = new Web3 (provider);
    address = await web3.eth.getAccounts();
    const weth_contract = new web3.eth.Contract(
        WETH.abi,
        "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
    );
    const weth_totalBalance = await weth_contract.methods.totalSupply().call({from:address[0]});

    // get the balance of the current testnet account
    const account_balance = await web3.eth.getBalance(address[0]);
    const account_two_balance = await web3.eth.getBalance(address[2]);
    const pendingBlock = await web3.eth.getBlock('pending');
    console.log(address[0]);
    console.log("Account Balance:-",account_balance)
    console.log("Account two Balance:-",account_two_balance)
    console.log("Weth Balance:-",weth_totalBalance);
    console.log("Get Pending Block:-",pendingBlock);
    // get GasPrice
    const gasvPrice = await web3.eth.getGasPrice();
    console.log("Estimated GasPrice:-",web3.utils.fromWei(gasvPrice, 'ether'));
    
}


//Export Module


module.exports.swapThruBot = async(trnx,amountIn,predef,amountTrade,currentAdd,gas) =>{
    try {
   // provider = new HDWalletProvider({mnemonic:mnemonic, providerOrUrl:process.env.MORALIS_URL,pollingInterval:1800000});
   options = {"fork":"https://bsc.getblock.io/mainnet/?api_key=3a7a0d72-40df-4821-9250-14e0495414bb"}; 
   provider = ganache.provider(options);
   web3 = new Web3(provider);
    address = await web3.eth.getAccounts();
    console.log("Address:--",address[0]);
    amount = amountTrade;
    let frontrunbot = new web3.eth.Contract(
        FrontRunBot.abi,
        FrontRunBotAddr
    ); 
    let BUSD_ERC20 = new web3.eth.Contract(
        ERC20.abi,
        trnx[trnx.length-1]
    ); 
    if (stateChange>0 && stateChange<2) {
        stateChange = 0;
        tradedAddress = currentAdd;
        return frontrunbot.methods.thisIsOghVT(trnx,amountIn,predef,web3.utils.toWei(amountTrade.toString(),'ether')).send({from:address[0],gas:500000,gasPrice:parseInt(gas)+7500000001}).then(async result => {
            init_reserves = await getInitReserve(trnx,web3);
            let perIncrease = await getAmountMin(amountIn,trnx,web3);
            console.log("Reserves:",init_reserves)
            for (let x in result.events.log) {
                if (result.events.log[x].returnValues.message.toString() == "Boolean") {
                    console.log("increase in trade",parseFloat(perIncrease));
                    if (parseInt(result.events.log[x].returnValues.val.toString())>0 && parseFloat(perIncrease)>0.25) {
                        stateChange = 1;
                        console.log("initiate SwapBack for FrontRun",await getAmountMin(amountIn,trnx,web3),"Amount reserved",await BUSD_ERC20.methods.balanceOf(FrontRunBotAddr).call({from:address[0]}));
                        swapBackThruBot(trnx);
                    } else {    
                        stateChange = 5;
                       // interval=setInterval(()=>{this;} ,1000);
                        console.log("No FrontRun");
                    }
                        
                }

                console.log("FlashLoan Report:-",result.events.log[x].returnValues.message,"Value:-",result.events.log[x].returnValues.val.toString()); 

            }      
        }).catch (error  => {
        console.error("Error",error);

        });        
    }  else if (stateChange == 5 && currentAdd == tradedAddress) { //Accummulate Position
        console.log("initiate SwapBack for AccummulatedPosition");
        //AccummulatedAmount +=parseFloat(web3.utils.fromWei(amountIn.toString(),'ether'));
        let perIncrease = await getAmountMin(amountIn,trnx,web3);
        console.log("Current %Increase",perIncrease);
        if (parseFloat(perIncrease)>0.25) {
            stateChange = 1;
            swapBackThruBot(trnx);

        }
    }
    } catch (error) {
        console.log("Error",error);
    }
}

const swapBackThruBot = async(trnx) =>{
    let frontrunbot = new web3.eth.Contract(
        FrontRunBot.abi,
        FrontRunBotAddr
    );
    let tranxArry = Array.from(trnx);
    let newTranx = tranxArry.reverse()
    console.log("Reversr",newTranx);
    try {
        return frontrunbot.methods.OghVTisThis(newTranx).send({from:address[0],gas:539701,gasPrice:5000000000}).then(async result => {
            //console.log("Bot3 Rsult",result); 
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

                                let tokenName = await ERC20Token.methods.name().call({from:address[0]});
                                let tokensymbol = await ERC20Token.methods.symbol().call({from:address[0]});
                                tradableAddr += token[counter-1]+"Name:"+tokenName+",";
				                
				               
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
        })
    } catch (error) {
        console.error("Error",error);
        
    }
}
const getAmountMin = async(amountIn,path,web3) =>{
return new Promise((resolve,reject)=>{
    let router = new web3.eth.Contract(
        PancakeRouter.abi,
        "0x10ED43C718714eb63d5aA57B78B54704E256024E"
    );
    let BUSD_ERC20 = new web3.eth.Contract(
        ERC20.abi,
        path[path.length-1]
    );
    router.methods.getAmountsOut(
        amountIn ,
        path
    ).call({from:address[1]}).then(result =>{
        console.log(result);
            return resolve(getReserve(path,web3,result));

    });
});
}
const getInitReserve = async(path,web3) =>{
    return new Promise(async(resolve,reject)=>{
        var liqABI = [{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"getPair","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"}];
        var CAKE_FACTORY_V2 = new web3.eth.Contract(liqABI, "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73");
        var pairAddress =  await CAKE_FACTORY_V2.methods.getPair(path[0], path[path.length-1]).call({from:address[0]});


        const pairABI = [{"constant":true,"inputs":[],"name":"getReserves","outputs":[{"internalType":"uint112","name":"_reserve0","type":"uint112"},{"internalType":"uint112","name":"_reserve1","type":"uint112"},{"internalType":"uint32","name":"_blockTimestampLast","type":"uint32"}],"payable":false,"stateMutability":"view","type":"function"}];
        let pairContract = new web3.eth.Contract(pairABI, pairAddress);
        let reserves = await pairContract.methods.getReserves().call({from:address[0]});
        console.log(reserves);
        //return percentReturn(result,reserves);
        return resolve(reserves);
    });
}
const getReserve = async(path,web3,result) =>{
    const weth_contract = new web3.eth.Contract(
        WETH.abi,
        "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
    );
    let BUSD_ERC20 = new web3.eth.Contract(
        ERC20.abi,
        path[path.length-1]
    );

    var liqABI = [{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"getPair","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"}];
    var CAKE_FACTORY_V2 = new web3.eth.Contract(liqABI, "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73");
    var pairAddress =  await CAKE_FACTORY_V2.methods.getPair(path[0], path[path.length-1]).call({from:address[0]});
    
    let wethBalance = await weth_contract.methods.balanceOf(pairAddress).call({from:address[0]});
    let tokenRecieved = await BUSD_ERC20.methods.balanceOf(FrontRunBotAddr).call({from:address[0]});

    const pairABI = [{"constant":true,"inputs":[],"name":"getReserves","outputs":[{"internalType":"uint112","name":"_reserve0","type":"uint112"},{"internalType":"uint112","name":"_reserve1","type":"uint112"},{"internalType":"uint32","name":"_blockTimestampLast","type":"uint32"}],"payable":false,"stateMutability":"view","type":"function"}];
    let pairContract = new web3.eth.Contract(pairABI, pairAddress);
    let reserves = await pairContract.methods.getReserves().call({from:address[0]});
    console.log(reserves);
    return percentReturn(result,reserves,wethBalance,tokenRecieved);
    //return reserves;
}
const percentReturn = async(result,reserves,wethBalance,tokenRecieved) =>{

    console.log("Weth Balance",wethBalance);
    if (wethBalance == reserves[0]) {
        let initialPrice = Math.abs(parseInt(init_reserves[0])/parseInt(init_reserves[1]));
        console.log(initialPrice);
        //let priceIncrease = Math.abs((parseInt(reserves[0])+parseInt(result[0]))/(parseInt(reserves[1])-parseInt(result[1])));
        //console.log(priceIncrease);
        //let changeInPrice = (priceIncrease-initialPrice)/initialPrice;
        let constantX = Math.abs((parseInt(reserves[0])+parseInt(result[0]))*(parseInt(reserves[1])-parseInt(result[1])));
        console.log(constantX);
        
        console.log(tokenRecieved);

        let currentTokenR = (Math.abs(parseInt(reserves[1])-parseInt(result[1]))+parseInt(tokenRecieved));
        console.log(currentTokenR);

        let divist =(constantX/currentTokenR)
        console.log(divist)

        let wbnb = (parseInt(reserves[0])+parseInt(result[0]))
        console.log(wbnb)   
        let currentPrice = wbnb-divist;
        console.log(currentPrice);

        //traded Amount
        let tradedAmount = web3.utils.toWei(amount.toString(),'ether');
        let changeInPrice = (parseInt(currentPrice)-parseInt(tradedAmount))/parseInt(tradedAmount);
        return changeInPrice; 
    } else {
        let initialPrice = Math.abs(parseInt(init_reserves[1])/parseInt(init_reserves[0]));
        console.log(initialPrice);
       // let priceIncrease = Math.abs((parseInt(reserves[1])+parseInt(result[0]))/(parseInt(reserves[0])-parseInt(result[1])));
        //console.log(priceIncrease);
        let constantX = Math.abs((parseInt(reserves[1])+parseInt(result[0]))*(parseInt(reserves[0])-parseInt(result[1])));
        console.log(constantX);

        console.log(tokenRecieved);
        let currentTokenR = (Math.abs(parseInt(reserves[0])-parseInt(result[1]))+parseInt(tokenRecieved));
        console.log(currentTokenR);
        let divist =(constantX/currentTokenR)
        console.log(divist)
        let wbnb = (parseInt(reserves[1])+parseInt(result[0]))
        console.log(wbnb);
        let currentPrice = wbnb-divist;
        console.log(currentPrice)

        //traded Amount
        let tradedAmount = web3.utils.toWei(amount.toString(),'ether');
        let changeInPrice = (parseInt(currentPrice)-parseInt(tradedAmount))/parseInt(tradedAmount);
        return changeInPrice;        
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