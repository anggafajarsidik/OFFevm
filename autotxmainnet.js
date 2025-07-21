import Web3 from 'web3';
import fs from 'fs/promises';
import inquirer from 'inquirer';
import { STABLECOIN_CONTRACTS } from './StablecoinContracts.js';

const sleep = (seconds) => new Promise(resolve => setTimeout(resolve, seconds * 1000));

const purple = (text) => `\x1b[35m${text}\x1b[0m`;
const blue = (text) => `\x1b[34m${text}\x1b[0m`;
const green = (text) => `\x1b[32m${text}\x1b[0m`;
const cyan = (text) => `\x1b[36m${text}\x1b[0m`;

const createdByLogo = `
 ██████╗ ███████╗███████╗    ███████╗ █████╗ ███╗   ███╗██╗██╗  ██╗   ██╗
██╔═══██╗██╔════╝██╔════╝    ██╔════╝██╔══██╗████╗ ████║██║██║  ╚██╗ ██╔╝
██║   ██║█████╗  █████╗      █████╗  ███████║██╔████╔██║██║██║   ╚████╔╝ 
██║   ██║██╔══╝  ██╔══╝      ██╔══╝  ██╔══██║██║╚██╔╝██║██║██║    ╚██╔╝  
╚██████╔╝██║     ██║         ██║     ██║  ██║██║ ╚═╝ ██║██║███████╗██║   
 ╚═════╝ ╚═╝     
╚═╝         ╚═╝     ╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚══════╝╚═╝   
`;

const creativeMessage = `
We’re here to make blockchain easier and better.
`;

const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {"name": "_to", "type": "address"},
      {"name": "_value", "type": "uint256"}
    ],
    "name": "transfer",
    "outputs": [{"name": "", "type": "bool"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [{"name": "", "type": "string"}],
    "type": "function"
  }
];

const formatTokenAmount = (amountWei, decimals) => {
    if (!amountWei || amountWei === '0') return '0';
    const amountBN = Web3.utils.toBN(amountWei);
    const divisor = Web3.utils.toBN(10).pow(Web3.utils.toBN(decimals));
    
    const integerPart = amountBN.div(divisor).toString();
    let decimalPart = amountBN.mod(divisor).toString();

    decimalPart = '0'.repeat(Math.max(0, decimals - decimalPart.length)) + decimalPart;
    decimalPart = decimalPart.replace(/0+$/, '');
    
    if (decimalPart === '') {
        return integerPart;
    }
    return `${integerPart}.${decimalPart}`;
};


const main = async () => {
  console.clear();
  console.log(purple("=== Starting the process ==="));
  console.log(purple("Script created by:"));
  console.log(purple(createdByLogo));
  console.log(purple(creativeMessage));

  const privateKeys = (await fs.readFile("YourPrivateKey.txt", "utf-8"))
    .split("\n")
    .map(key => key.trim())
    .filter(key => key);

  privateKeys.forEach((key, index) => {
    if (!/^0x[a-fA-F0-9]{64}$/.test(key)) {
      if (/^[a-fA-F0-9]{64}$/.test(key)) {
        privateKeys[index] = `0x${key}`;
      } else {
        console.error(`Invalid private key format: ${key}`);
        process.exit(1);
      }
    }
  });

  const networks = JSON.parse(await fs.readFile("listchainmainnet.txt", "utf-8"));

  const { networkChoice } = await inquirer.prompt([
    {
      type: "list",
      name: "networkChoice",
      message: "Pick the network you want to use:",
      choices: ["0. All Networks (Asset Detection)", ...networks.map((net, index) => `${index + 1}. ${net.name}`)],
    },
  ]);

  if (networkChoice === "0. All Networks (Asset Detection)") {
    console.log(purple("\n=== Detecting Assets Across All Wallets & Networks ==="));
    const detectedBalancesByWallet = new Map();

    for (const privateKey of privateKeys) {
        const tempWeb3 = new Web3(); 
        const account = tempWeb3.eth.accounts.privateKeyToAccount(privateKey);
        detectedBalancesByWallet.set(privateKey, {
            address: account.address,
            assets: [] 
        });

        console.log(`\n--- Wallet Address: ${green(account.address)} ---`);
        
        let foundAnyAssetForWallet = false;

        for (const network of networks) {
            console.log(`  Scanning Network: ${cyan(network.name)}`);
            const web3All = new Web3(network.rpcUrl);
            let hasAssetOnThisNetwork = false;

            const usdcContract = STABLECOIN_CONTRACTS.find(s => s.chainId === network.chainId && s.symbol === "USDC");
            if (usdcContract) {
                try {
                    const tokenInstance = new web3All.eth.Contract(ERC20_ABI, usdcContract.address);
                    const tokenBalanceWei = await tokenInstance.methods.balanceOf(account.address).call();
                    if (web3All.utils.toBN(tokenBalanceWei).gt(web3All.utils.toBN('0'))) { 
                        const formattedBalance = formatTokenAmount(tokenBalanceWei, usdcContract.decimals);
                        console.log(`    USDC Balance (${usdcContract.symbol}): ${blue(formattedBalance)}`);
                        detectedBalancesByWallet.get(privateKey).assets.push({
                            network: network,
                            type: 'ERC20',
                            token: usdcContract,
                            balance: tokenBalanceWei
                        });
                        hasAssetOnThisNetwork = true;
                        foundAnyAssetForWallet = true;
                    }
                } catch (error) {
                }
            }

            const usdtContract = STABLECOIN_CONTRACTS.find(s => s.chainId === network.chainId && s.symbol === "USDT");
            if (usdtContract) {
                try {
                    const tokenInstance = new web3All.eth.Contract(ERC20_ABI, usdtContract.address);
                    const tokenBalanceWei = await tokenInstance.methods.balanceOf(account.address).call();
                    if (web3All.utils.toBN(tokenBalanceWei).gt(web3All.utils.toBN('0'))) { 
                        const formattedBalance = formatTokenAmount(tokenBalanceWei, usdtContract.decimals);
                        console.log(`    USDT Balance (${usdtContract.symbol}): ${blue(formattedBalance)}`);
                        detectedBalancesByWallet.get(privateKey).assets.push({
                            network: network,
                            type: 'ERC20',
                            token: usdtContract,
                            balance: tokenBalanceWei
                        });
                        hasAssetOnThisNetwork = true;
                        foundAnyAssetForWallet = true;
                    }
                } catch (error) {
                }
            }

            try {
                const nativeBalance = await web3All.eth.getBalance(account.address);
                if (web3All.utils.toBN(nativeBalance).gt(web3All.utils.toBN('0'))) { 
                    console.log(`    Native Balance (${network.symbol}): ${blue(web3All.utils.fromWei(nativeBalance, "ether"))}`);
                    detectedBalancesByWallet.get(privateKey).assets.push({
                        network: network,
                        type: 'Native',
                        balance: nativeBalance
                    });
                    hasAssetOnThisNetwork = true;
                    foundAnyAssetForWallet = true;
                }
            } catch (error) {
                if (error.message.includes("Invalid JSON RPC response") || error.message.includes("timeout")) {
                    console.error(purple(`    Error connecting to ${network.name}: ${error.message}`));
                }
            }
            if (!hasAssetOnThisNetwork) {
                console.log(purple(`    No assets found on ${network.name}.`));
            }
        }
        if (!foundAnyAssetForWallet) {
            console.log(purple("  No assets found across all scanned networks for this wallet."));
        }
    }
    console.log(purple("\n=== Asset Detection Completed ==="));

    const detectedBalances = [];
    for (const [privateKey, walletData] of detectedBalancesByWallet.entries()) {
        walletData.assets.forEach(asset => {
            detectedBalances.push({
                privateKey: privateKey, 
                address: walletData.address, 
                ...asset
            });
        });
    }


    if (detectedBalances.length > 0) {
        console.log(purple("\n--- Summary of Balances Found ---"));
        const summaryByWallet = new Map();
        detectedBalances.forEach(item => {
            if (!summaryByWallet.has(item.address)) {
                summaryByWallet.set(item.address, []);
            }
            summaryByWallet.get(item.address).push(item);
        });

        for (const [walletAddress, assets] of summaryByWallet.entries()) {
            console.log(`\nWallet: ${green(walletAddress)}`);
            const assetsSortedForDisplay = assets.sort((a, b) => {
                const order = { 'USDC': 1, 'USDT': 2, 'Native': 3 };
                let aTypeOrder = a.type === 'Native' ? order.Native : order[a.token.symbol];
                let bTypeOrder = b.type === 'Native' ? order.Native : order[b.token.symbol];
                
                if (a.network.name !== b.network.name) {
                    return a.network.name.localeCompare(b.network.name); 
                }
                return aTypeOrder - bTypeOrder; 
            });

            assetsSortedForDisplay.forEach(item => {
                const tempWeb3ForFormatting = new Web3(); 
                let balanceString;
                if (item.type === 'Native') {
                    balanceString = `${blue(tempWeb3ForFormatting.utils.fromWei(item.balance, "ether"))} ${item.network.symbol}`;
                } else { 
                    balanceString = `${blue(formatTokenAmount(item.balance, item.token.decimals))} ${item.token.symbol}`;
                }
                console.log(`  on ${cyan(item.network.name)} (${item.type}): ${balanceString}`);
            });
        }


        const { confirmTransfer } = await inquirer.prompt([
            {
                type: "confirm",
                name: "confirmTransfer",
                message: purple("\nDo you want to transfer ALL detected assets (USDC, USDT, then Native) to a single destination address? (Gas fees will apply per network)"),
                default: false,
            },
        ]);

        if (confirmTransfer) {
            const { destinationAddress } = await inquirer.prompt([
                {
                    type: "input",
                    name: "destinationAddress",
                    message: purple("Enter the SINGLE destination address to send all assets to:"),
                    validate: input => /^0x[a-fA-F0-9]{40}$/.test(input) || "Please enter a valid Ethereum address.",
                },
            ]);

            const { confirmAddress } = await inquirer.prompt([
                {
                    type: "input",
                    name: "confirmAddress",
                    message: purple(`\nIs this the correct destination address? ${green(destinationAddress)}\nType 'y' to confirm or anything else to cancel:`),
                    validate: input => input.toLowerCase() === 'y' || true, 
                },
            ]);

            if (confirmAddress.toLowerCase() !== 'y') {
                console.log(purple("\nDestination address not confirmed. Automatic transfer cancelled. Exiting."));
                process.exit(0);
            }

            console.log(purple("\n=== Starting Automatic Asset Transfers ==="));
            console.log(purple(`All detected assets will be sent to: ${green(destinationAddress)}`));
            console.log(purple("IMPORTANT: Ensure your wallets have enough native token for GAS FEES on EACH network."));
            console.log(purple("--------------------------------------------------\n"));

            const transferOrderSymbols = ['USDC', 'USDT', 'Native']; 
            for (const assetSymbol of transferOrderSymbols) {
                const assetsToTransferOfType = detectedBalances.filter(item => {
                    if (assetSymbol === 'Native') return item.type === 'Native';
                    return item.type === 'ERC20' && item.token.symbol === assetSymbol;
                });

                if (assetsToTransferOfType.length > 0) {
                    console.log(blue(`\n--- Processing ${assetSymbol} Transfers ---`));
                    for (const item of assetsToTransferOfType) {
                        const web3Transfer = new Web3(item.network.rpcUrl);
                        const account = web3Transfer.eth.accounts.privateKeyToAccount(item.privateKey);
                        let currentNonce = await web3Transfer.eth.getTransactionCount(account.address, "latest");

                        console.log(cyan(`Processing wallet ${green(account.address)} on ${item.network.name} for ${assetSymbol}...`));

                        try {
                            const gasPriceResult = await web3Transfer.eth.getGasPrice();
                            let currentBaseFeePerGas = web3Transfer.utils.toBN(gasPriceResult);
                            
                            const maxPriorityFeePerGas = web3Transfer.utils.toBN(web3Transfer.utils.toWei('0.01', 'gwei')); 
                            const maxFeePerGas = currentBaseFeePerGas.add(maxPriorityFeePerGas).mul(web3Transfer.utils.toBN(120)).div(web3Transfer.utils.toBN(100));

                            let gasLimit;
                            let rawAmountToSend;
                            let tx;

                            if (item.type === 'Native') {
                                try {
                                    gasLimit = await web3Transfer.eth.estimateGas({
                                        from: account.address,
                                        to: destinationAddress,
                                        value: web3Transfer.utils.toWei('1', 'wei'), 
                                    });
                                    gasLimit = web3Transfer.utils.toBN(Math.floor(parseInt(gasLimit) * 1.2)); 
                                    console.log(blue(`  Estimated Gas Limit: ${gasLimit.toString()}`));
                                } catch (estimateError) {
                                    console.warn(purple(`  Could not estimate gas. Using default 21000. Error: ${estimateError.message}`));
                                    gasLimit = web3Transfer.utils.toBN(21000); 
                                }

                                const currentBalanceWei = web3Transfer.utils.toBN(item.balance);
                                const estimatedTxCost = gasLimit.mul(maxFeePerGas);
                                const safetyBuffer = web3Transfer.utils.toBN(web3Transfer.utils.toWei('0.000001', 'ether')); 

                                rawAmountToSend = currentBalanceWei.sub(estimatedTxCost).sub(safetyBuffer);

                                if (rawAmountToSend.lt(web3Transfer.utils.toBN('0'))) {
                                    console.error(purple(`  Insufficient ${item.network.symbol} balance for gas. Have: ${web3Transfer.utils.fromWei(currentBalanceWei, 'ether')} ${item.network.symbol}, Needed for gas: ${web3Transfer.utils.fromWei(estimatedTxCost, 'ether')} ${item.network.symbol}. Skipping this transfer.`));
                                    continue; 
                                }
                                if (rawAmountToSend.lt(web3Transfer.utils.toBN('10000'))) { 
                                    rawAmountToSend = web3Transfer.utils.toBN('0');
                                    console.warn(purple(`  Amount to send is very small after gas and buffer. Sending 0 ${item.network.symbol}.`));
                                }

                                if (rawAmountToSend.isZero()) {
                                    console.warn(purple(`  Skipping transfer for ${account.address} on ${item.network.name} as final amount to send is 0 ${item.network.symbol}.`));
                                    continue;
                                }

                                tx = {
                                    to: destinationAddress,
                                    value: rawAmountToSend.toString(),
                                    gas: gasLimit.toString(),
                                    maxFeePerGas: maxFeePerGas.toString(), 
                                    maxPriorityFeePerGas: maxPriorityFeePerGas.toString(), 
                                    nonce: currentNonce,
                                    chainId: item.network.chainId,
                                };
                            } else { 
                                const tokenInstance = new web3Transfer.eth.Contract(ERC20_ABI, item.token.address);
                                const currentTokenBalanceWei = web3Transfer.utils.toBN(item.balance);
                                rawAmountToSend = currentTokenBalanceWei; 

                                try {
                                    gasLimit = await web3Transfer.eth.estimateGas({
                                        from: account.address,
                                        to: item.token.address,
                                        data: tokenInstance.methods.transfer(destinationAddress, rawAmountToSend.toString()).encodeABI(),
                                    });
                                    gasLimit = web3Transfer.utils.toBN(Math.floor(parseInt(gasLimit) * 1.2));
                                    console.log(blue(`  Estimated Gas Limit: ${gasLimit.toString()}`));
                                } catch (estimateError) {
                                    console.warn(purple(`  Could not estimate gas for ERC20. Using default 100000. Error: ${estimateError.message}`));
                                    gasLimit = web3Transfer.utils.toBN(100000); 
                                }

                                const nativeBalanceForGas = web3Transfer.utils.toBN(await web3Transfer.eth.getBalance(account.address));
                                const estimatedGasCostForTokenTx = gasLimit.mul(maxFeePerGas);

                                if (nativeBalanceForGas.lt(estimatedGasCostForTokenTx)) {
                                    console.error(purple(`  Insufficient ${item.network.symbol} (native token) for gas to send ${item.token.symbol}. Have: ${web3Transfer.utils.fromWei(nativeBalanceForGas, 'ether')} ${item.network.symbol}, Needed for gas: ${web3Transfer.utils.fromWei(estimatedGasCostForTokenTx, 'ether')} ${item.network.symbol}. Skipping this token transfer.`));
                                    continue; 
                                }

                                if (rawAmountToSend.isZero()) {
                                    console.warn(purple(`  Skipping transfer for ${account.address} on ${item.network.name} (${item.token.symbol}) as final amount to send is 0.`));
                                    continue;
                                }
                                
                                tx = {
                                    to: item.token.address, 
                                    data: tokenInstance.methods.transfer(destinationAddress, rawAmountToSend.toString()).encodeABI(), 
                                    gas: gasLimit.toString(),
                                    maxFeePerGas: maxFeePerGas.toString(),
                                    maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
                                    nonce: currentNonce, 
                                    chainId: item.network.chainId,
                                    value: '0x0' 
                                };
                            }

                            const signedTx = await web3Transfer.eth.accounts.signTransaction(tx, item.privateKey);
                            const receipt = await web3Transfer.eth.sendSignedTransaction(signedTx.rawTransaction);
                            
                            const explorerLink = item.network.explorer + receipt.transactionHash;
                            const transferredAmountDisplay = item.type === 'Native' ? 
                                blue(web3Transfer.utils.fromWei(rawAmountToSend, 'ether')) + ` ${item.network.symbol}` :
                                blue(formatTokenAmount(rawAmountToSend, item.token.decimals)) + ` ${item.token.symbol}`;

                            console.log(`  ✅ Transfer successful: ${transferredAmountDisplay} to ${green(destinationAddress)}: ${blue(explorerLink)}`);
                            await sleep(5); 
                        } catch (error) {
                            let errorMessage = `  ❌ Transfer failed for ${account.address} on ${item.network.name} (${item.type === 'Native' ? item.network.symbol : item.token.symbol}): ${error.message}`;
                            if (error.message.includes("insufficient funds")) {
                                console.error(purple(`${errorMessage}. Skipping this transfer due to insufficient native funds for gas.`));
                            } else if (error.message.includes("Replacement transaction underpriced") || error.message.includes("nonce already used")) {
                                console.error(purple(`${errorMessage}. This might indicate a nonce or gas fee issue (transaction stuck). Skipping this transfer.`));
                            } else {
                                console.error(purple(`${errorMessage}. Skipping this transfer.`));
                            }
                        }
                    }
                }
            }
            console.log(purple("\n=== All Automatic Transfers Completed ==="));
        } else {
            console.log(purple("\nAutomatic transfer cancelled. Exiting."));
        }
    } else {
        console.log(purple("\nNo assets found across all wallets and networks. Exiting."));
    }
    process.exit(0); 
  }


  const networkChoiceIndex = parseInt(networkChoice.split(".")[0]) - 1;
  const { name, rpcUrl, chainId, symbol } = networks[networkChoiceIndex];

  const web3 = new Web3(rpcUrl);

  const { transferMode } = await inquirer.prompt([
    {
      type: "list",
      name: "transferMode",
      message: "What do you want to transfer?",
      choices: ["ETH", "ERC20 Token"],
    },
  ]);

  let tokenContractAddress = null;
  let tokenContract = null;
  let tokenDecimals = 18; 
  let tokenSymbol = symbol; 

  if (transferMode === "ERC20 Token") {
    const { contractAddress } = await inquirer.prompt([
      {
        type: "input",
        name: "contractAddress",
        message: "Enter the ERC20 token contract address:",
        validate: input => /^0x[a-fA-F0-9]{40}$/.test(input) || "Please enter a valid contract address.",
      },
    ]);
    tokenContractAddress = contractAddress;
    tokenContract = new web3.eth.Contract(ERC20_ABI, tokenContractAddress);

    try {
      tokenDecimals = await tokenContract.methods.decimals().call();
      tokenSymbol = await tokenContract.methods.symbol().call();
      console.log(green(`Token detected: ${tokenSymbol} with ${tokenDecimals} decimals.`));

      console.log(purple("\n--- Current Token Balances ---"));
      for (const privateKey of privateKeys) {
        const account = web3.eth.accounts.privateKeyToAccount(privateKey);
        try {
          const tokenBalanceWei = await tokenContract.methods.balanceOf(account.address).call();
          const formattedBalance = parseFloat(web3.utils.fromWei(tokenBalanceWei, 'ether')).toFixed(tokenDecimals > 18 ? 18 : tokenDecimals);
          console.log(`Address ${green(account.address)}: ${blue(formattedBalance)} ${tokenSymbol}`);
        } catch (error) {
          console.error(purple(`Error fetching token balance for ${account.address}: ${error.message}`));
        }
      }
      console.log(purple("--- End Token Balances ---\n"));

    } catch (error) {
      console.warn(purple(`Could not fetch token decimals or symbol. Assuming 18 decimals and default symbol. Error: ${error.message}`));
    }
  }

  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "amount",
      message: `Enter the amount to send (in ${tokenSymbol} or "all" for full balance):`,
      validate: input => {
        if (input.toLowerCase() === 'all') return true;
        return !isNaN(parseFloat(input)) && parseFloat(input) > 0 || `Please enter a valid positive number or "all".`;
      },
    },
    {
      type: "input",
      "name": "transactionsCount",
      message: "Enter number of transactions per address:",
      validate: input => !isNaN(parseInt(input)) && parseInt(input) > 0,
    },
    {
      type: "input",
      name: "delay",
      message: "How much delay (in seconds) between transactions?",
      validate: input => !isNaN(input) && input >= 0,
    },
    {
      type: "confirm",
      name: "useListAddresses",
      message: "Do you want to send to multiple addresses from listaddress.txt?",
      default: true,
    },
    {
      type: "input",
      name: "singleAddress",
      message: "Enter one address to send to (if not using list):",
      when: (answers) => !answers.useListAddresses,
      validate: input => /^0x[a-fA-F0-9]{40}$/.test(input) ||
"Please enter a valid Ethereum address.",
    },
  ]);
  const { amount, transactionsCount, delay, useListAddresses, singleAddress } = answers;
  const targetAddresses = useListAddresses
    ?
    (await fs.readFile("listaddress.txt", "utf-8")).split("\n").map(addr => addr.trim()).filter(addr => addr)
    : [singleAddress];

  console.log(`\nSelected Network: ${name}`);
  console.log(`Number of Addresses to Send To: ${targetAddresses.length}`);

  for (const privateKey of privateKeys) {
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    if (transferMode === "ETH") {
      const currentBalance = await web3.eth.getBalance(account.address);
      console.log(`Current balance of sender ${green(account.address)}: ${blue(web3.utils.fromWei(currentBalance, "ether"))} ${symbol}`);
    } else { 
      try {
        const tokenBalanceWei = await tokenContract.methods.balanceOf(account.address).call();
        const formattedBalance = parseFloat(web3.utils.fromWei(tokenBalanceWei, 'ether')).toFixed(tokenDecimals > 18 ? 18 : tokenDecimals);
        console.log(`Address ${green(account.address)}: ${blue(formattedBalance)} ${tokenSymbol}`);
      } catch (error) {
        console.error(`Error fetching token balance for ${account.address}: ${error.message}`);
        console.log(`Current balance of sender ${green(account.address)}: ${blue("N/A")} ${tokenSymbol}`);
      }
    }
  }

  for (const privateKey of privateKeys) {
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    let nonce = await web3.eth.getTransactionCount(account.address, "latest");

    for (let i = 0; i < transactionsCount; i++) {
      for (const toAddress of targetAddresses) {
        try {
          const gasPriceResult = await web3.eth.getGasPrice();
          let currentBaseFeePerGas = web3.utils.toBN(gasPriceResult);
          
          const maxPriorityFeePerGas = web3.utils.toBN(web3.utils.toWei('0.01', 'gwei')); 
          
          const maxFeePerGas = currentBaseFeePerGas.add(maxPriorityFeePerGas).mul(web3.utils.toBN(120)).div(web3.utils.toBN(100));


          let rawAmountToSend;
          let transaction;

          if (transferMode === "ETH") {
            let gasLimit;
            try {
                gasLimit = await web3.eth.estimateGas({
                    from: account.address,
                    to: toAddress,
                    value: web3.utils.toWei('1', 'wei'), 
                });
                gasLimit = web3.utils.toBN(Math.floor(parseInt(gasLimit) * 1.2)); 
                console.log(blue(`Estimated Gas Limit for ETH to ${toAddress}: ${gasLimit.toString()}`));
            } catch (estimateError) {
                console.warn(purple(`Could not estimate gas for ETH to ${toAddress}. Using default 21000. Error: ${estimateError.message}`));
                gasLimit = web3.utils.toBN(21000); 
            }

            const currentBalanceWei = web3.utils.toBN(await web3.eth.getBalance(account.address));
            const estimatedTxCost = gasLimit.mul(maxFeePerGas);

            if (amount.toLowerCase() === 'all') {
                const safetyBuffer = web3.utils.toBN(web3.utils.toWei('0.000001', 'ether')); 

                rawAmountToSend = currentBalanceWei.sub(estimatedTxCost).sub(safetyBuffer);

                if (rawAmountToSend.lt(web3.utils.toBN('0'))) {
                    console.error(purple(`Insufficient ETH balance for gas on ${account.address}. Have: ${web3.utils.fromWei(currentBalanceWei, 'ether')} ETH, Needed for gas: ${web3.utils.fromWei(estimatedTxCost, 'ether')} ETH. Skipping transaction.`));
                    continue; 
                }
                if (rawAmountToSend.lt(web3.utils.toBN('10000'))) { 
                    rawAmountToSend = web3.utils.toBN('0');
                    console.warn(purple(`Amount to send for ${account.address} is very small after gas and buffer. Sending 0 ETH.`));
                }

            } else {
                rawAmountToSend = web3.utils.toBN(web3.utils.toWei(amount, "ether"));
                if (currentBalanceWei.lt(rawAmountToSend.add(estimatedTxCost))) {
                    console.error(purple(`Insufficient ETH balance for amount and gas on ${account.address}. Have: ${web3.utils.fromWei(currentBalanceWei, 'ether')} ETH, Want: ${web3.utils.fromWei(rawAmountToSend, 'ether')} ETH + ${web3.utils.fromWei(estimatedTxCost, 'ether')} ETH for gas. Skipping transaction.`));
                    continue;
                }
            }
            
            if (rawAmountToSend.isZero()) {
                console.warn(purple(`Skipping transaction for ${account.address} as final amount to send is 0 ETH.`));
                continue;
            }

            transaction = {
              to: toAddress,
              value: rawAmountToSend.toString(),
              gas: gasLimit.toString(),
              maxFeePerGas: maxFeePerGas.toString(), 
              maxPriorityFeePerGas: maxPriorityFeePerGas.toString(), 
              nonce: nonce,
              chainId: chainId,
            };
          } else { 
            let tokenAmountWei;
            let currentTokenBalanceWei = await tokenContract.methods.balanceOf(account.address).call();

            if (web3.utils.toBN(currentTokenBalanceWei).isZero()) {
                console.warn(purple(`Skipping transaction for ${account.address} as token balance is 0 ${tokenSymbol}.`));
                continue; 
            }

            if (amount.toLowerCase() === 'all') {
              tokenAmountWei = currentTokenBalanceWei; 
            } else {
              const amountParts = amount.split('.');
              const integerPart = amountParts[0];
              const decimalPart = amountParts[1] || '';
              
              let fullAmountString = integerPart + decimalPart;
              let numDecimalsInInput = decimalPart.length;

              if (numDecimalsInInput > tokenDecimals) {
                  console.warn(purple(`Warning: Input amount has more decimal places than the token's decimals. Truncating to ${tokenDecimals} decimals.`));
                  fullAmountString = integerPart + decimalPart.substring(0, tokenDecimals);
                  numDecimalsInInput = tokenDecimals;
              }
              
              const remainingZerosToPad = tokenDecimals - numDecimalsInInput;
              const finalAmountString = fullAmountString + '0'.repeat(remainingZerosToPad);
              
              tokenAmountWei = web3.utils.toBN(finalAmountString).toString();
              
              if (web3.utils.toBN(tokenAmountWei).gt(web3.utils.toBN(currentTokenBalanceWei))) {
                  console.error(purple(`Insufficient token balance for ${account.address}. Requested ${amount} ${tokenSymbol}, but only have ${web3.utils.fromWei(currentTokenBalanceWei, 'ether')} ${tokenSymbol}. Skipping transaction.`));
                  continue; 
              }
            }
            
            const data = tokenContract.methods.transfer(toAddress, tokenAmountWei.toString()).encodeABI(); 

            let gasLimit;
            try {
                gasLimit = await web3.eth.estimateGas({
                    from: account.address,
                    to: tokenContractAddress,
                    data: data,
                });
                gasLimit = web3.utils.toBN(Math.floor(parseInt(gasLimit) * 1.2));
                console.log(blue(`Estimated Gas Limit for ERC20 to ${toAddress}: ${gasLimit.toString()}`));
            } catch (estimateError) {
                console.warn(purple(`Could not estimate gas for ERC20 to ${toAddress}. Using default 100000. Error: ${estimateError.message}`));
                gasLimit = web3.utils.toBN(100000); 
            }

            transaction = {
              to: tokenContractAddress, 
              data: data, 
              gas: gasLimit.toString(),
              maxFeePerGas: maxFeePerGas.toString(),
              maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
              nonce: nonce,
              chainId: chainId,
              value: '0x0' 
            };
          }

          const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
          const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
          const explorerLink = item.network.explorer + receipt.transactionHash;
          console.log(`✅ Transfer successful: ${blue(web3.utils.fromWei(amountToSend, 'ether'))} ${item.network.symbol} to ${green(destinationAddress)}: ${blue(explorerLink)}`);
          nonce++;
          if (delay > 0) await sleep(delay);
        } catch (error) {
          let errorMessage = `Error in transaction to ${toAddress}: ${error.message}`;
          if (error.receipt && error.receipt.status === false) {
              errorMessage += " - Transaction reverted on chain. Check explorer for details.";
          }
          if (error.reason) {
              errorMessage += ` Reason: ${error.reason}`;
          }
          console.error(purple(errorMessage));
        }
      }
    }
  }

  console.log(purple("\n=== All transactions completed ==="));
  for (const privateKey of privateKeys) {
    try {
      const account = web3.eth.accounts.privateKeyToAccount(privateKey);
      if (transferMode === "ETH") {
        const balance = await web3.eth.getBalance(account.address);
        console.log(`\nFinal balance of sender ${green(account.address)}: ${blue(web3.utils.fromWei(balance, "ether"))} ${symbol}`);
      } else { 
        const tokenBalanceWei = await tokenContract.methods.balanceOf(account.address).call();
        const formattedBalance = parseFloat(web3.utils.fromWei(tokenBalanceWei, 'ether')).toFixed(tokenDecimals > 18 ? 18 : tokenDecimals);
        console.log(`\nFinal balance of sender ${green(account.address)}: ${blue(formattedBalance)} ${tokenSymbol}`);
      }
    } catch (error) {
      console.error(`Error fetching final balance: ${error.message}`);
    }
  }
};

main().catch(error => console.error("An error occurred:", error.message));
