const Web3 = require('web3');
const ganache = require("ganache");
const HDWalletProvider = require('@truffle/hdwallet-provider');
const prompt = require('prompt');
const WETH = require("../build/contract/WETH.json");
const PancakeRouter = require("../build/contract/pancakeRouter.json");
const PancakeFactory = require("../build/contract/pancakeFactory.json");

const ERC20 = require("../build/contract/ERC20.json");
const BN = require("bn.js");
const options = {"fork":"https://speedy-nodes-nyc.moralis.io/346380c8eca1a345a08fbdc8/bsc/mainnet"};
const provider = ganache.provider(options);

const web3 = new Web3(provider);

let address = null;
let balance = null;
let balancebSwap = null;
let balanceASwap = null;
prompt.start();
let amount = null;
let token = null;
let slipAmount = null
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
    swapToken(amount,[wbnb,token],slipAmount);

}
const swapToken = async (amountIn,path,slip) => {
    console.log("Address:-",address[0]);
    let router = new web3.eth.Contract(
        PancakeRouter.abi,
        "0x10ED43C718714eb63d5aA57B78B54704E256024E"
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
            console.log('Slipage Amount:-',Slippage);
            
                let swapBUSD = await router.methods.swapExactETHForTokensSupportingFeeOnTransferTokens(
                    Slippage.toString().split('.')[0],
                    path,
                    address[0],
                    Math.floor(Date.now() / 1000) + 60 * 10).send({from:address[0],value:web3.utils.toWei(amountIn.toString(),'ether'),gas:300000,gasPrice:10000000000});
                console.log("Swap Report:-",swapBUSD);  

                //SwapBack

                let amountTokenIn = await BUSD_ERC20.methods.balanceOf(address[0]).call({from:address[0]});
                console.log("Amount of TOken Recieved:-",amountTokenIn.toString());
                balancebSwap = await web3.eth.getBalance(address[0]);
                console.log("Address one Balance:-",balancebSwap);  
                return BUSD_ERC20.methods.approve("0x10ED43C718714eb63d5aA57B78B54704E256024E",amountTokenIn).send({from:address[0]}).then(async result=> {
                    //console.log("Approve Contract:-",result);
                    let swapBUSDToBNB = await router.methods.swapExactTokensForETHSupportingFeeOnTransferTokens(
                        amountTokenIn,
                        0,
                        path.reverse(),
                        address[0],
                        Math.floor(Date.now() / 1000) + 60 * 10).send({from:address[0],gas:300000,gasPrice:10000000000});
                    for (let x in swapBUSDToBNB.events){
                        console.log("Data:-",parseInt(swapBUSDToBNB.events[x].raw.data,16));
                        console.log("Swap Back Contract:-",swapBUSDToBNB.events[x].raw);
                    }
                        
                    balanceASwap = await web3.eth.getBalance(address[0]);
                    console.log("Address one Balance:-",balanceASwap,"beforeswap",balancebSwap); 
                    console.log("Address one Balance:-",parseInt(balanceASwap)-parseInt(balancebSwap));  
                    if (swapBUSDToBNB)
                        console.log("Swap Successful")
                    }).catch (error => {
                        console.error("Er-ror",error)
                    });
          
            
        }).catch (error => {
            console.error("Er-ror",error)
        });

    } catch (err) {
        console.error(err);
        
    }

}