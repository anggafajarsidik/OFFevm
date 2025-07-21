import Web3 from 'web3';
import fs from 'fs/promises';
import inquirer from 'inquirer';

const sleep = (seconds) => new Promise(resolve => setTimeout(resolve, seconds * 1000));

const purple = (text) => `\x1b[35m${text}\x1b[0m`;

const blue = (text) => `\x1b[34m${text}\x1b[0m`;

const green = (text) => `\x1b[32m${text}\x1b[0m`;

const explorerMap = {
  1: 'https://etherscan.io/tx/',
  56: 'https://bscscan.com/tx/',
  137: 'https://polygonscan.com/tx/',
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
      choices: networks.map((net, index) => `${index + 1}. ${net.name}`),
    },
  ]);

  const networkChoiceIndex = parseInt(networkChoice.split(".")[0]) - 1;
  const { name, rpcUrl, chainId, symbol } = networks[networkChoiceIndex];

  console.log(purple(`\nConnecting to the ${name} network...`));
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
          const formattedBalance = web3.utils.fromWei(tokenBalanceWei, 'ether');
          console.log(`Address ${green(account.address)}: ${blue(parseFloat(formattedBalance).toFixed(tokenDecimals > 18 ? 18 : tokenDecimals))} ${tokenSymbol}`);
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
      validate: input => !isNaN(parseInt(input)) && parseInt(input) >= 0,
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
          
          // Mengurangi maxPriorityFeePerGas ke nilai yang lebih realistis untuk Arbitrum
          // 0.01 Gwei = 10.000.000 wei
          const maxPriorityFeePerGas = web3.utils.toBN(web3.utils.toWei('0.01', 'gwei')); 
          
          // maxFeePerGas harus lebih besar dari (baseFee + maxPriorityFeePerGas)
          // Menambahkan buffer 20%
          const maxFeePerGas = currentBaseFeePerGas.add(maxPriorityFeePerGas).mul(web3.utils.toBN(120)).div(web3.utils.toBN(100));


          let rawAmountToSend;
          let transaction;

          if (transferMode === "ETH") {
            rawAmountToSend = (amount.toLowerCase() === 'all') ? 
                              (await web3.eth.getBalance(account.address) - (maxFeePerGas.mul(web3.utils.toBN(21000)))).toString() : 
                              web3.utils.toWei(amount, "ether");

            if (web3.utils.toBN(rawAmountToSend).lt(web3.utils.toBN('0'))) { 
              console.error(purple(`Insufficient ETH balance for gas on ${account.address}. Skipping transaction.`));
              continue; 
            }

            let gasLimit;
            try {
              gasLimit = await web3.eth.estimateGas({
                from: account.address,
                to: toAddress,
                value: rawAmountToSend,
              });
              gasLimit = Math.floor(gasLimit * 1.2); 
              console.log(blue(`Estimated Gas Limit for ETH to ${toAddress}: ${gasLimit}`));
            } catch (estimateError) {
              console.warn(purple(`Could not estimate gas for ETH to ${toAddress}. Using default 21000. Error: ${estimateError.message}`));
              gasLimit = 21000;
            }

            transaction = {
              to: toAddress,
              value: rawAmountToSend,
              gas: gasLimit,
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
                gasLimit = Math.floor(gasLimit * 1.2);
                console.log(blue(`Estimated Gas Limit for ERC20 to ${toAddress}: ${gasLimit}`));
            } catch (estimateError) {
                console.warn(purple(`Could not estimate gas for ERC20 to ${toAddress}. Using default 100000. Error: ${estimateError.message}`));
                gasLimit = 100000; 
            }

            transaction = {
              to: tokenContractAddress, 
              data: data, 
              gas: gasLimit,
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
