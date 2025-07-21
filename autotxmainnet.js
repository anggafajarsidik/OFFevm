import Web3 from 'web3';
import fs from 'fs/promises';
import inquirer from 'inquirer';

const sleep = (seconds) => new Promise(resolve => setTimeout(resolve, seconds * 1000));

const purple = (text) => `\x1b[35m${text}\x1b[0m`;
const blue = (text) => `\x1b[34m${text}\x1b[0m`;
const green = (text) => `\x1b[32m${text}\x1b[0m`;
const cyan = (text) => `\x1b[36m${text}\x1b[0m`;

const explorerMap = {
  1: 'https://etherscan.io/tx/',
  56: 'https://bscscan.com/tx/',
  137: 'https://polygonscan.io/tx/',
  42161: 'https://arbiscan.io/tx/',
  10: 'https://optimistic.etherscan.io/tx/',
  324: 'https://explorer.zksync.io/tx/',
  8453: 'https://basescan.org/tx/'
};

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
      choices: ["0. All Networks (Native Token Detection)", ...networks.map((net, index) => `${index + 1}. ${net.name}`)],
    },
  ]);

  if (networkChoice === "0. All Networks (Native Token Detection)") {
    console.log(purple("\n=== Detecting Native Token Balances Across All Wallets & Networks ==="));
    const detectedBalances = []; 

    for (const privateKey of privateKeys) {
        const tempWeb3 = new Web3(); 
        const account = tempWeb3.eth.accounts.privateKeyToAccount(privateKey);
        console.log(`\n--- Wallet Address: ${green(account.address)} ---`);
        
        let foundBalanceOnAnyNetworkForWallet = false;

        for (const network of networks) {
            const web3All = new Web3(network.rpcUrl);

            try {
                const nativeBalance = await web3All.eth.getBalance(account.address);
                if (web3All.utils.toBN(nativeBalance).gt(web3All.utils.toBN('0'))) {
                    console.log(`  Network: ${network.name}`);
                    console.log(`    Native Balance (${network.symbol}): ${blue(web3All.utils.fromWei(nativeBalance, "ether"))}`);
                    foundBalanceOnAnyNetworkForWallet = true;
                    detectedBalances.push({
                        privateKey: privateKey,
                        network: network,
                        balance: nativeBalance
                    });
                }
            } catch (error) {
                if (error.message.includes("Invalid JSON RPC response")) {
                    console.error(purple(`    Error connecting to ${network.name}: ${error.message}`));
                }
            }
        }
        if (!foundBalanceOnAnyNetworkForWallet) {
            console.log(purple("  No native token balance found on any scanned network."));
        }
    }
    console.log(purple("\n=== Native Token Detection Completed ==="));

    if (detectedBalances.length > 0) {
        console.log(purple("\n--- Summary of Balances Found ---"));
        detectedBalances.forEach(item => {
            const tempWeb3ForFormatting = new Web3(); 
            // Pastikan fungsi warna digunakan dengan benar
            console.log(`${green(tempWeb3ForFormatting.eth.accounts.privateKeyToAccount(item.privateKey).address)} on ${cyan(item.network.name)}: ${blue(tempWeb3ForFormatting.utils.fromWei(item.balance, "ether"))} ${item.network.symbol}`);
        });

        const { confirmTransfer } = await inquirer.prompt([
            {
                type: "confirm",
                name: "confirmTransfer",
                message: purple("\nDo you want to transfer ALL detected native assets to a single destination address? (Gas fees will apply per network)"),
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

            console.log(purple("\n=== Starting Automatic Native Asset Transfers ==="));
            console.log(purple(`All assets will be sent to: ${green(destinationAddress)}`));
            console.log(purple("IMPORTANT: Ensure your wallets have enough native token for GAS FEES on EACH network."));
            console.log(purple("--------------------------------------------------\n"));

            for (const item of detectedBalances) {
                const web3Transfer = new Web3(item.network.rpcUrl);
                const account = web3Transfer.eth.accounts.privateKeyToAccount(item.privateKey);
                let nonce = await web3Transfer.eth.getTransactionCount(account.address, "latest");

                console.log(cyan(`Processing wallet ${green(account.address)} on ${item.network.name}...`));

                try {
                    const gasPriceResult = await web3Transfer.eth.getGasPrice();
                    let currentBaseFeePerGas = web3Transfer.utils.toBN(gasPriceResult);
                    
                    const maxPriorityFeePerGas = web3Transfer.utils.toBN(web3Transfer.utils.toWei('0.01', 'gwei')); 
                    
                    const maxFeePerGas = currentBaseFeePerGas.add(maxPriorityFeePerGas).mul(web3Transfer.utils.toBN(120)).div(web3Transfer.utils.toBN(100));


                    let gasLimit;
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

                    let amountToSend = currentBalanceWei.sub(estimatedTxCost).sub(safetyBuffer);

                    if (amountToSend.lt(web3Transfer.utils.toBN('0'))) {
                        console.error(purple(`  Insufficient ${item.network.symbol} balance for gas. Have: ${web3Transfer.utils.fromWei(currentBalanceWei, 'ether')} ${item.network.symbol}, Needed for gas: ${web3Transfer.utils.fromWei(estimatedTxCost, 'ether')} ${item.network.symbol}. Skipping this transfer.`));
                        continue; 
                    }
                    if (amountToSend.lt(web3Transfer.utils.toBN('10000'))) { 
                        amountToSend = web3Transfer.utils.toBN('0');
                        console.warn(purple(`  Amount to send is very small after gas and buffer. Sending 0 ${item.network.symbol}.`));
                    }

                    if (amountToSend.isZero()) {
                        console.warn(purple(`  Skipping transfer for ${account.address} on ${item.network.name} as final amount to send is 0 ${item.network.symbol}.`));
                        continue;
                    }

                    const tx = {
                        to: destinationAddress,
                        value: amountToSend.toString(),
                        gas: gasLimit.toString(),
                        maxFeePerGas: maxFeePerGas.toString(), 
                        maxPriorityFeePerGas: maxPriorityFeePerGas.toString(), 
                        nonce: nonce,
                        chainId: item.network.chainId,
                    };

                    const signedTx = await web3Transfer.eth.accounts.signTransaction(tx, item.privateKey);
                    const receipt = await web3Transfer.eth.sendSignedTransaction(signedTx.rawTransaction);
                    const explorerLink = item.network.explorer + receipt.transactionHash;
                    console.log(`  ✅ Transfer successful: ${blue(web3Transfer.utils.fromWei(amountToSend, 'ether'))} ${item.network.symbol} to ${green(destinationAddress)}: ${blue(explorerLink)}`);
                    await sleep(5); 
                } catch (error) {
                    console.error(purple(`  ❌ Transfer failed for ${account.address} on ${item.network.name}: ${error.message}`));
                }
            }
            console.log(purple("\n=== All Automatic Transfers Completed ==="));
        } else {
            console.log(purple("\nAutomatic transfer cancelled. Exiting."));
        }
    } else {
        console.log(purple("\nNo native token balances found across all wallets and networks. Exiting."));
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
      name: "transactionsCount",
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
        const tokenBalance = parseFloat(web3.utils.fromWei(tokenBalanceWei, 'ether')).toFixed(tokenDecimals > 18 ? 18 : tokenDecimals);
        console.log(`Current balance of sender ${green(account.address)}: ${blue(tokenBalance)} ${tokenSymbol}`);
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

          const signedTx = await web3.eth.accounts.signTransaction(transaction, privateKey);
          const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
          const explorerLink = explorerMap[chainId] + receipt.transactionHash;
          console.log(`Transaction to ${green(toAddress)} successful: ${blue(explorerLink)}`);
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
        const tokenBalance = parseFloat(web3.utils.fromWei(tokenBalanceWei, 'ether')).toFixed(tokenDecimals > 18 ? 18 : tokenDecimals);
        console.log(`\nFinal balance of sender ${green(account.address)}: ${blue(tokenBalance)} ${tokenSymbol}`);
      }
    } catch (error) {
      console.error(`Error fetching final balance: ${error.message}`);
    }
  }
};

main().catch(error => console.error("An error occurred:", error.message));
