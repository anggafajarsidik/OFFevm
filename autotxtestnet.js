import Web3 from 'web3';
import fs from 'fs/promises';
import inquirer from 'inquirer';

const sleep = (seconds) => new Promise(resolve => setTimeout(resolve, seconds * 1000));

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const typeOut = async (text, speed = 5) => {
  for (let char of text) {
    process.stdout.write(char);
    await delay(speed);
  }
};

const purple = (text) => `\x1b[35m${text}\x1b[0m`;
const blue = (text) => `\x1b[34m${text}\x1b[0m`;
const green = (text) => `\x1b[32m${text}\x1b[0m`;
const cyan = (text) => `\x1b[36m${text}\x1b[0m`;

const logoLines = [
  " ██████╗ ███████╗███████╗    ███████╗ █████╗ ███╗   ███╗██╗██╗  ██╗   ██╗",
  "██╔═══██╗██╔════╝██╔════╝    ██╔════╝██╔══██╗████╗ ████║██║██║  ╚██╗ ██╔╝",
  "██║   ██║█████╗  █████╗      █████╗  ███████║██╔████╔██║██║██║   ╚████╔╝ ",
  "██║   ██║██╔══╝  ██╔══╝      ██╔══╝  ██╔══██║██║╚██╔╝██║██║██║    ╚██╔╝  ",
  "╚██████╔╝██║     ██║         ██║     ██║  ██║██║ ╚═╝ ██║██║███████╗██║   ",
  " ╚═════╝ ╚═╝     ╚═╝         ╚═╝     ╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚══════╝╚═╝   ",
];

const creativeMessage = `
╔══════════════════════════════════════════════════════╗
║  ✨ Echoes of code ripple through the chain 🌐💥 ✨   ║
╚══════════════════════════════════════════════════════╝\n`;

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
  await typeOut(purple("=== Starting the process ===\n"), 10);
  await typeOut(purple("Script created by:\n\n"), 10);
  for (let line of logoLines) await typeOut(purple(line + "\n"), 1);
  await typeOut(purple(creativeMessage), 5);

  const privateKeys = (await fs.readFile("YourPrivateKey.txt", "utf-8")).split("\n").map(key => key.trim()).filter(key => key);
  const networks = JSON.parse(await fs.readFile("listchaintestnet.txt", "utf-8"));

  const { networkChoice } = await inquirer.prompt([
    {
      type: "list",
      name: "networkChoice",
      message: "Pick the network you want to use:",
      choices: ["0. All Networks (Native Token Detection)", ...networks.map((net, index) => `${index + 1}. ${net.name}`)],
    },
  ]);

  if (networkChoice === "0. All Networks (Native Token Detection)") {
    await typeOut(purple("\n=== Detecting Native Token Balances Across All Wallets & Networks ===\n"), 5);
    const detectedBalances = []; 

    for (const privateKey of privateKeys) {
        const tempWeb3 = new Web3(); 
        const account = tempWeb3.eth.accounts.privateKeyToAccount(privateKey);
        await typeOut(`\n--- Wallet Address: ${green(account.address)} ---\n`, 5);
        
        let foundBalanceOnAnyNetworkForWallet = false;

        for (const network of networks) {
            await typeOut(`  Scanning Network: ${cyan(network.name)}\n`, 1);
            const web3All = new Web3(network.rpcUrl);

            try {
                const nativeBalance = await web3All.eth.getBalance(account.address);
                if (web3All.utils.toBN(nativeBalance).gt(web3All.utils.toBN('0'))) {
                    await typeOut(`    Native Balance (${network.symbol}): ${blue(web3All.utils.fromWei(nativeBalance, "ether"))}\n`, 1);
                    foundBalanceOnAnyNetworkForWallet = true;
                    detectedBalances.push({
                        privateKey: privateKey,
                        network: network, 
                        balance: nativeBalance
                    });
                }
            } catch (error) {
                if (error.message.includes("Invalid JSON RPC response") || error.message.includes("timeout")) {
                    await typeOut(purple(`    Error connecting to ${network.name}: ${error.message}\n`), 5);
                } else {
                    await typeOut(purple(`    Error fetching balance on ${network.name}: ${error.message}\n`), 5);
                }
            }
        }
        if (!foundBalanceOnAnyNetworkForWallet) {
            await typeOut(purple("  No native token balance found on any scanned network.\n"), 5);
        }
    }
    await typeOut(purple("\n=== Native Token Detection Completed ===\n"), 5);

    if (detectedBalances.length > 0) {
        await typeOut(purple("\n--- Summary of Balances Found ---\n"), 5);
        detectedBalances.forEach(item => {
            const tempWeb3ForFormatting = new Web3(); 
            const walletAddress = tempWeb3ForFormatting.eth.accounts.privateKeyToAccount(item.privateKey).address;
            const balanceString = `${blue(tempWeb3ForFormatting.utils.fromWei(item.balance, "ether"))} ${item.network.symbol}`;
            typeOut(`${green(walletAddress)} on ${cyan(item.network.name)}: ${balanceString}\n`, 1);
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

            const { confirmAddress } = await inquirer.prompt([
                {
                    type: "input",
                    name: "confirmAddress",
                    message: purple(`\nIs this the correct destination address? ${green(destinationAddress)}\nType 'y' to confirm or anything else to cancel:`),
                    validate: input => input.toLowerCase() === 'y' || true, 
                },
            ]);

            if (confirmAddress.toLowerCase() !== 'y') {
                await typeOut(purple("\nDestination address not confirmed. Automatic transfer cancelled. Exiting.\n"), 5);
                process.exit(0);
            }

            await typeOut(purple("\n=== Starting Automatic Native Asset Transfers ===\n"), 5);
            await typeOut(purple(`All native assets will be sent to: ${green(destinationAddress)}\n`), 5);
            await typeOut(purple("IMPORTANT: Ensure your wallets have enough native token for GAS FEES on EACH network.\n"), 5);
            await typeOut(purple("--------------------------------------------------\n\n"), 5);

            for (const item of detectedBalances) {
                const web3Transfer = new Web3(item.network.rpcUrl);
                const account = web3Transfer.eth.accounts.privateKeyToAccount(item.privateKey);
                let currentNonce = await web3Transfer.eth.getTransactionCount(account.address, "latest");

                await typeOut(cyan(`Processing wallet ${green(account.address)} on ${item.network.name}...\n`), 5);

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
                        await typeOut(blue(`  Estimated Gas Limit: ${gasLimit.toString()}\n`), 1);
                    } catch (estimateError) {
                        await typeOut(purple(`  Could not estimate gas. Using default 21000. Error: ${estimateError.message}\n`), 5);
                        gasLimit = web3Transfer.utils.toBN(21000); 
                    }

                    const currentBalanceWei = web3Transfer.utils.toBN(item.balance);
                    const estimatedTxCost = gasLimit.mul(maxFeePerGas);

                    const safetyBuffer = web3Transfer.utils.toBN(web3Transfer.utils.toWei('0.000001', 'ether')); 

                    let amountToSend = currentBalanceWei.sub(estimatedTxCost).sub(safetyBuffer);

                    if (amountToSend.lt(web3Transfer.utils.toBN('0'))) {
                        await typeOut(purple(`  Insufficient ${item.network.symbol} balance for gas. Have: ${web3Transfer.utils.fromWei(currentBalanceWei, 'ether')} ${item.network.symbol}, Needed for gas: ${web3Transfer.utils.fromWei(estimatedTxCost, 'ether')} ${item.network.symbol}. Skipping this transfer.\n`), 5);
                        continue; 
                    }
                    if (amountToSend.lt(web3Transfer.utils.toBN('10000'))) { 
                        amountToSend = web3Transfer.utils.toBN('0');
                        await typeOut(purple(`  Amount to send is very small after gas and buffer. Sending 0 ${item.network.symbol}.\n`), 5);
                    }

                    if (amountToSend.isZero()) {
                        await typeOut(purple(`  Skipping transfer for ${account.address} on ${item.network.name} as final amount to send is 0 ${item.network.symbol}.\n`), 5);
                        continue;
                    }

                    const tx = {
                        to: destinationAddress,
                        value: amountToSend.toString(),
                        gas: gasLimit.toString(),
                        maxFeePerGas: maxFeePerGas.toString(), 
                        maxPriorityFeePerGas: maxPriorityFeePerGas.toString(), 
                        nonce: currentNonce,
                        chainId: item.network.chainId,
                    };

                    const signedTx = await web3Transfer.eth.accounts.signTransaction(tx, item.privateKey);
                    const receipt = await web3Transfer.eth.sendSignedTransaction(signedTx.rawTransaction);
                    
                    const explorerLink = item.network.explorer + receipt.transactionHash;
                    const transferredAmountDisplay = blue(web3Transfer.utils.fromWei(amountToSend, 'ether')) + ` ${item.network.symbol}`;

                    await typeOut(`  ✅ Transfer successful: ${transferredAmountDisplay} to ${green(destinationAddress)}: ${blue(explorerLink)}\n`, 5);
                    await sleep(5); 
                } catch (error) {
                    let errorMessage = `  ❌ Transfer failed for ${account.address} on ${item.network.name} (${item.network.symbol}): ${error.message}`;
                    if (error.message.includes("insufficient funds")) {
                        await typeOut(purple(`${errorMessage}. Skipping this transfer due to insufficient native funds for gas.\n`), 5);
                    } else if (error.message.includes("Replacement transaction underpriced") || error.message.includes("nonce already used")) {
                        await typeOut(purple(`${errorMessage}. This might indicate a nonce or gas fee issue (transaction stuck). Skipping this transfer.\n`), 5);
                    } else {
                        await typeOut(purple(`${errorMessage}. Skipping this transfer.\n`), 5);
                    }
                }
            }
            await typeOut(purple("\n=== All Automatic Transfers Completed ===\n"), 5);
        } else {
            await typeOut(purple("\nAutomatic transfer cancelled. Exiting.\n"), 5);
        }
    } else {
        await typeOut(purple("\nNo native token balances found across all wallets and networks. Exiting.\n"), 5);
    }
    process.exit(0); 
  }


  const networkChoiceIndex = parseInt(networkChoice.split(".")[0]) - 1;
  const { name, rpcUrl, chainId, symbol, explorer } = networks[networkChoiceIndex];

  const web3 = new Web3(rpcUrl);

  const { transferMode } = await inquirer.prompt([
    {
      type: "list",
      name: "transferMode",
      message: "What do you want to transfer?",
      choices: ["Native Coin (ETH/BNB/MATIC)", "ERC20 Token"],
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
      await typeOut(green(`Token detected: ${tokenSymbol} with ${tokenDecimals} decimals.\n`), 5);

      await typeOut(purple("\n--- Current Token Balances ---\n"), 5);
      for (const privateKey of privateKeys) {
        const account = web3.eth.accounts.privateKeyToAccount(privateKey);
        try {
          const tokenBalanceWei = await tokenContract.methods.balanceOf(account.address).call();
          const formattedBalance = parseFloat(web3.utils.fromWei(tokenBalanceWei, 'ether')).toFixed(tokenDecimals > 18 ? 18 : tokenDecimals);
          await typeOut(`Address ${green(account.address)}: ${blue(formattedBalance)} ${tokenSymbol}\n`, 1);
        } catch (error) {
          await typeOut(purple(`Error fetching token balance for ${account.address}: ${error.message}\n`), 5);
        }
      }
      await typeOut(purple("--- End Token Balances ---\n\n"), 5);

    } catch (error) {
      await typeOut(purple(`Could not fetch token decimals or symbol. Assuming 18 decimals and default symbol. Error: ${error.message}\n`), 5);
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
      message: "Enter the number of transactions per address:",
      validate: input => !isNaN(parseInt(input)) && parseInt(input) > 0,
    },
    {
      type: "input",
      name: "delay",
      message: "How much delay (in seconds) between transactions?",
      validate: input => !isNaN(input) && input >= 0,
    },
    {
      type: "input",
      name: "retryDelay",
      message: "How much delay (in seconds) before retrying failed transactions?",
      validate: input => !isNaN(input) && input >= 0,
    },
    {
      type: "confirm",
      name: "useListAddresses",
      message: "Do you want to use addresses from listaddress.txt?",
      default: true,
    }
  ]);
  const { amount, transactionsCount, delay: txDelay, retryDelay, useListAddresses } = answers;

  const targetAddresses = useListAddresses
    ?
    (await fs.readFile("listaddress.txt", "utf-8")).split("\n").map(addr => addr.trim()).filter(addr => addr)
    : [];

  console.log(`\nYou have selected the network: ${cyan(name)}.`);
  console.log(`Total wallets to use: ${privateKeys.length}`);
  console.log(`Total target addresses: ${targetAddresses.length || "Each wallet will send to itself"}`);

  const privateKeysWithPrefix = privateKeys.map(key => key.startsWith("0x") ? key : `0x${key}`);

  for (let walletIndex = 0; walletIndex < privateKeysWithPrefix.length; walletIndex++) {
    const privateKey = privateKeysWithPrefix[walletIndex];
    const web3Instance = new Web3(rpcUrl); 
    const account = web3Instance.eth.accounts.privateKeyToAccount(privateKey);

    await typeOut(`\n🔄 Switching to Wallet ${walletIndex + 1} of ${privateKeysWithPrefix.length}: ${green(account.address)}\n`, 5);

    for (let i = 0; i < (targetAddresses.length || 1); i++) {
      const toAddress = targetAddresses[i] ||
      account.address;

      try {
        const code = await web3Instance.eth.getCode(toAddress);
        if (code !== "0x") {
          await typeOut(`⚠️ Skipping contract address: ${toAddress}\n`, 5);
          continue;
        }
      } catch (e) {
        await typeOut(`⚠️ Couldn't verify address type, continuing anyway...\n`, 5);
      }

      for (let txIndex = 0; txIndex < transactionsCount; txIndex++) {
        await typeOut(`\n🚀 Sending transaction #${txIndex + 1} from ${green(account.address)} to ${cyan(toAddress)}...\n`, 5);
        let success = false;

        while (!success) {
          try {
            const gasPriceResult = await web3Instance.eth.getGasPrice();
            let currentBaseFeePerGas = web3Instance.utils.toBN(gasPriceResult);
            
            const maxPriorityFeePerGas = web3Instance.utils.toBN(web3Instance.utils.toWei('0.01', 'gwei')); 
            const maxFeePerGas = currentBaseFeePerGas.add(maxPriorityFeePerGas).mul(web3Instance.utils.toBN(120)).div(web3Instance.utils.toBN(100));

            let rawAmountToSend;
            let transaction;

            if (transferMode === "Native Coin (ETH/BNB/MATIC)") {
              let gasLimit;
              try {
                  gasLimit = await web3Instance.eth.estimateGas({
                      from: account.address,
                      to: toAddress,
                      value: web3Instance.utils.toWei('1', 'wei'), 
                  });
                  gasLimit = web3Instance.utils.toBN(Math.floor(parseInt(gasLimit) * 1.2)); 
                  await typeOut(blue(`  Estimated Gas Limit: ${gasLimit.toString()}\n`), 1);
              } catch (estimateError) {
                  await typeOut(purple(`  Could not estimate gas. Using default 21000. Error: ${estimateError.message}\n`), 5);
                  gasLimit = web3Instance.utils.toBN(21000); 
              }

              const currentBalanceWei = web3Instance.utils.toBN(await web3Instance.eth.getBalance(account.address));
              const estimatedTxCost = gasLimit.mul(maxFeePerGas);

              if (amount.toLowerCase() === 'all') {
                  const safetyBuffer = web3Instance.utils.toBN(web3Instance.utils.toWei('0.000001', 'ether')); 

                  rawAmountToSend = currentBalanceWei.sub(estimatedTxCost).sub(safetyBuffer);

                  if (rawAmountToSend.lt(web3Instance.utils.toBN('0'))) {
                      await typeOut(purple(`  Insufficient ${symbol} balance for gas. Have: ${web3Instance.utils.fromWei(currentBalanceWei, 'ether')} ${symbol}, Needed for gas: ${web3Instance.utils.fromWei(estimatedTxCost, 'ether')} ${symbol}. Skipping transaction.\n`), 5);
                      break; 
                  }
                  if (rawAmountToSend.lt(web3Instance.utils.toBN('10000'))) { 
                      rawAmountToSend = web3Instance.utils.toBN('0');
                      await typeOut(purple(`  Amount to send is very small after gas and buffer. Sending 0 ${symbol}.\n`), 5);
                  }
              } else {
                  rawAmountToSend = web3Instance.utils.toBN(web3Instance.utils.toWei(amount, "ether"));
                  if (currentBalanceWei.lt(rawAmountToSend.add(estimatedTxCost))) {
                      await typeOut(purple(`  Insufficient ${symbol} balance for amount and gas. Have: ${web3Instance.utils.fromWei(currentBalanceWei, 'ether')} ${symbol}, Want: ${web3Instance.utils.fromWei(rawAmountToSend, 'ether')} ${symbol} + ${web3Instance.utils.fromWei(estimatedTxCost, 'ether')} ${symbol} for gas. Skipping transaction.\n`), 5);
                      break;
                  }
              }
              
              if (rawAmountToSend.isZero()) {
                  await typeOut(purple(`  Skipping transaction for ${account.address} as final amount to send is 0 ${symbol}.\n`), 5);
                  break;
              }

              transaction = {
                to: toAddress,
                value: rawAmountToSend.toString(),
                gas: gasLimit.toString(),
                maxFeePerGas: maxFeePerGas.toString(), 
                maxPriorityFeePerGas: maxPriorityFeePerGas.toString(), 
                nonce: currentNonce,
                chainId: chainId,
              };
            } else { 
              let tokenContract = new web3Instance.eth.Contract(ERC20_ABI, tokenContractAddress);
              let currentTokenBalanceWei = await tokenContract.methods.balanceOf(account.address).call();
              rawAmountToSend = web3Instance.utils.toBN(amount.toLowerCase() === 'all' ? currentTokenBalanceWei : web3Instance.utils.toWei(amount, 'ether')); // Perhatikan ini, untuk token non-all

              try {
                  gasLimit = await web3Instance.eth.estimateGas({
                      from: account.address,
                      to: tokenContractAddress,
                      data: tokenContract.methods.transfer(toAddress, rawAmountToSend.toString()).encodeABI(),
                  });
                  gasLimit = web3Instance.utils.toBN(Math.floor(parseInt(gasLimit) * 1.2));
                  await typeOut(blue(`  Estimated Gas Limit: ${gasLimit.toString()}\n`), 1);
              } catch (estimateError) {
                  await typeOut(purple(`  Could not estimate gas for ERC20. Using default 100000. Error: ${estimateError.message}\n`), 5);
                  gasLimit = web3Instance.utils.toBN(100000); 
              }

              const nativeBalanceForGas = web3Instance.utils.toBN(await web3Instance.eth.getBalance(account.address));
              const estimatedGasCostForTokenTx = gasLimit.mul(maxFeePerGas);

              if (nativeBalanceForGas.lt(estimatedGasCostForTokenTx)) {
                  await typeOut(purple(`  Insufficient ${symbol} (native token) for gas to send ${tokenSymbol}. Have: ${web3Instance.utils.fromWei(nativeBalanceForGas, 'ether')} ${symbol}, Needed for gas: ${web3Instance.utils.fromWei(estimatedGasCostForTokenTx, 'ether')} ${symbol}. Skipping this token transfer.\n`), 5);
                  break; 
              }

              if (web3Instance.utils.toBN(currentTokenBalanceWei).isZero()) {
                  await typeOut(purple(`  Skipping transaction for ${account.address} as token balance is 0 ${tokenSymbol}.\n`), 5);
                  break; 
              }
              if (rawAmountToSend.isZero()) {
                  await typeOut(purple(`  Skipping transfer for ${account.address} on ${name} (${tokenSymbol}) as final amount to send is 0.\n`), 5);
                  break;
              }
              
              transaction = {
                  to: tokenContractAddress, 
                  data: tokenContract.methods.transfer(toAddress, rawAmountToSend.toString()).encodeABI(), 
                  gas: gasLimit.toString(),
                  maxFeePerGas: maxFeePerGas.toString(),
                  maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
                  nonce: currentNonce, 
                  chainId: chainId,
                  value: '0x0' 
              };
            }

            const signedTx = await web3Instance.eth.accounts.signTransaction(transaction, privateKey);
            const receipt = await web3Instance.eth.sendSignedTransaction(signedTx.rawTransaction);
            
            const explorerLink = explorer + receipt.transactionHash;
            const transferredAmountDisplay = transferMode === 'Native Coin (ETH/BNB/MATIC)' ? 
                blue(web3Instance.utils.fromWei(rawAmountToSend, 'ether')) + ` ${symbol}` :
                blue(parseFloat(web3Instance.utils.fromWei(rawAmountToSend, 'ether')).toFixed(tokenDecimals > 18 ? 18 : tokenDecimals)) + ` ${tokenSymbol}`;

            await typeOut(`  ✅ Transaction successful: ${transferredAmountDisplay} to ${green(toAddress)}: ${blue(explorerLink)}\n`, 5);
            success = true;

            if (txDelay > 0) {
              await typeOut(`⏳ Waiting for ${txDelay} seconds before next transaction...\n`, 5);
              await sleep(txDelay);
            }
          } catch (error) {
            let errorMessage = `  ❌ Transaction failed from ${green(account.address)} to ${cyan(toAddress)}, retrying in ${retryDelay} seconds... Error: ${error.message}`;
            if (error.message.includes("insufficient funds")) {
                await typeOut(purple(`${errorMessage}. Skipping this wallet due to insufficient native funds for gas.\n`), 5);
                break; 
            } else {
                await typeOut(purple(`${errorMessage}.\n`), 5);
            }
            await sleep(retryDelay);
          }
        }
        if (!success) {
            await typeOut(purple(`  🚨 Failed to complete transaction for ${account.address} on ${name} after retries.\n`), 5);
        }
      }
    }
  }

  await typeOut(purple("🎉 === All transactions completed ===\n"), 5);
  for (const privateKey of privateKeys) {
    try {
      const account = web3.eth.accounts.privateKeyToAccount(privateKey);
      if (transferMode === "Native Coin (ETH/BNB/MATIC)") {
        const balance = await web3.eth.getBalance(account.address);
        await typeOut(`\nFinal balance of sender ${green(account.address)}: ${blue(web3.utils.fromWei(balance, "ether"))} ${symbol}\n`, 5);
      } else { 
        let tokenContract = new web3.eth.Contract(ERC20_ABI, tokenContractAddress);
        const tokenBalanceWei = await tokenContract.methods.balanceOf(account.address).call();
        const formattedBalance = parseFloat(web3.utils.fromWei(tokenBalanceWei, 'ether')).toFixed(tokenDecimals > 18 ? 18 : tokenDecimals);
        await typeOut(`\nFinal balance of sender ${green(account.address)}: ${blue(formattedBalance)} ${tokenSymbol}\n`, 5);
      }
    } catch (error) {
      await typeOut(`Error fetching final balance: ${error.message}\n`, 5);
    }
  }
};

main().catch(async (error) => {
  await typeOut(`Unexpected error occurred. Error: ${error.message}\n`, 5);
  process.exit(1); 
});
