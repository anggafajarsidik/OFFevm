import Web3 from 'web3';
import fs from 'fs/promises';
import inquirer from 'inquirer';

const sleep = (seconds) => new Promise(resolve => setTimeout(resolve, seconds * 1000));

const purple = (text) => `\x1b[35m${text}\x1b[0m`;
const blue = (text) => `\x1b[34m${text}\x1b[0m`;
const green = (text) => `\x1b[32m${text}\x1b[0m`;
const cyan = (text) => `\x1b[36m${text}\x1b[0m`;
const red = (text) => `\x1b[31m${text}\x1b[0m`;
const yellow = (text) => `\x1b[33m${text}\x1b[0m`;

const logoLines = [
  " ██████╗ ███████╗███████╗    ███████╗ █████╗ ███╗   ███╗██╗██╗  ██╗   ██╗",
  "██╔═══██╗██╔════╝██╔════╝    ██╔════╝██╔══██╗████╗ ████║██║██║  ╚██╗ ██╔╝",
  "██║   ██║█████╗  █████╗      █████╗  ███████║██╔████╔██║██║██║   ╚████╔╝ ",
  "██║   ██║██╔══╝  ██╔══╝      ██╔══╝  ██╔══██║██║╚██╔╝██║██║██║    ╚██╔╝  ",
  "╚██████╔╝██║     ██║         ██║     ██║  ██║██║ ╚═╝ ██║██║███████╗██║   ",
  " ╚═════╝ ╚═╝     ╚═╝         ╚═╝     ╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚══════╝╚╝   ",
];

const creativeMessage = `
╔══════════════════════════════════════════════════════╗
║  ✨ Echoes of code ripple through the chain 🌐💥 ✨   ║
╚══════════════════════════════════════════════════════╝\n`;

const ERC20_ABI = [
  { "constant": true, "inputs": [{"name": "_owner", "type": "address"}], "name": "balanceOf", "outputs": [{"name": "balance", "type": "uint256"}], "type": "function" },
  { "constant": false, "inputs": [{"name": "_to", "type": "address"}, {"name": "_value", "type": "uint256"}], "name": "transfer", "outputs": [{"name": "", "type": "bool"}], "type": "function" },
  { "constant": true, "inputs": [], "name": "decimals", "outputs": [{"name": "", "type": "uint8"}], "type": "function" },
  { "constant": true, "inputs": [], "name": "symbol", "outputs": [{"name": "", "type": "string"}], "type": "function" }
];

const formatTokenAmount = (amountWei, decimals) => {
    const amountBigInt = BigInt(amountWei || '0');
    const actualDecimals = typeof decimals === 'number' && decimals >= 0 ? decimals : 18;
    const amountInUnitsString = Web3.utils.fromWei(amountBigInt.toString(), actualDecimals);
    const amountInUnitsFloat = parseFloat(amountInUnitsString);
    const displayPrecision = Math.min(actualDecimals, 8);
    if (isNaN(amountInUnitsFloat) || !isFinite(amountInUnitsFloat)) {
        return 'Invalid Amount';
    }
    let formatted = amountInUnitsFloat.toFixed(displayPrecision);
    formatted = formatted.replace(/\.?0+$/, '');
    if (formatted === '0' && amountBigInt > 0n) {
        formatted = amountInUnitsFloat.toFixed(actualDecimals);
        formatted = formatted.replace(/\.?0+$/, '');
    }
    return formatted;
};

const main = async () => {
  console.clear();
  console.log(purple("=== Starting the process ===\n"));
  console.log(purple("Script created by:\n\n"));
  for (let line of logoLines) console.log(purple(line));
  console.log(purple(creativeMessage));

  const rawPrivateKeys = (await fs.readFile("YourPrivateKey.txt", "utf-8"))
    .split("\n")
    .map(key => key.trim())
    .filter(key => key);

  const walletAccounts = [];
  for (const key of rawPrivateKeys) {
    let formattedKey = key.startsWith("0x") ? key : `0x${key}`;
    try {
      const account = new Web3().eth.accounts.privateKeyToAccount(formattedKey);
      walletAccounts.push({ privateKey: formattedKey, account: account });
    } catch (e) {
      console.error(red(`\n--- Skipping invalid private key: ${key} ---`));
      console.error(yellow(`    Error: ${e.message}. Ensure YourPrivateKey.txt contains only valid private keys, one per line.`));
    }
  }

  if (walletAccounts.length === 0) {
      console.error(red("\nNo valid private keys found. Exiting."));
      process.exit(1);
  }

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
    console.log(purple("\n=== Detecting Native Token Balances Across All Wallets & Networks ===\n"));
    const detectedBalances = [];

    for (const wallet of walletAccounts) {
        console.log(`\n--- Wallet Address: ${green(wallet.account.address)} ---\n`);

        let foundBalanceOnAnyNetworkForWallet = false;

        for (const network of networks) {
            console.log(`  Scanning Network: ${cyan(network.name)}`);
            const web3All = new Web3(network.rpcUrl);

            try {
                const nativeBalance = await web3All.eth.getBalance(wallet.account.address);
                if (BigInt(nativeBalance) > 0n) {
                    console.log(`    Native Balance (${network.symbol}): ${blue(web3All.utils.fromWei(nativeBalance, "ether"))}`);
                    foundBalanceOnAnyNetworkForWallet = true;
                    detectedBalances.push({
                        privateKey: wallet.privateKey,
                        network: network,
                        balance: nativeBalance
                    });
                }
            } catch (error) {
                console.error(red(`    Error fetching balance on ${network.name}: ${error.message}`));
                console.error(yellow(`    Consider checking RPC URL validity or network stability for ${network.name}.`));
            }
        }
        if (!foundBalanceOnAnyNetworkForWallet) {
            console.log(purple("  No native token balance found on any scanned network."));
        }
    }
    console.log(purple("\n=== Native Token Detection Completed ===\n"));

    if (detectedBalances.length > 0) {
        console.log(purple("\n--- Summary of Balances Found ---\n"));
        detectedBalances.forEach(item => {
            const tempWeb3ForFormatting = new Web3();
            const walletAddress = tempWeb3ForFormatting.eth.accounts.privateKeyToAccount(item.privateKey).address;
            const balanceString = `${blue(tempWeb3ForFormatting.utils.fromWei(item.balance, "ether"))} ${item.network.symbol}`;
            console.log(`  ${green(walletAddress)} on ${cyan(item.network.name)}: ${balanceString}`);
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
                console.log(purple("\nDestination address not confirmed. Automatic transfer cancelled. Exiting.\n"));
                process.exit(0);
            }

            console.log(purple("\n=== Starting Automatic Native Asset Transfers ===\n"));
            console.log(purple(`All native assets will be sent to: ${green(destinationAddress)}\n`));
            console.log(purple("IMPORTANT: Ensure your wallets have enough native token for GAS FEES on EACH network.\n"));
            console.log(purple("--------------------------------------------------\n\n"));

            for (const item of detectedBalances) {
                const web3Transfer = new Web3(item.network.rpcUrl);
                
                let account;
                try {
                    account = web3Transfer.eth.accounts.privateKeyToAccount(item.privateKey);
                } catch (e) {
                    console.error(red(`Error creating account from private key during transfer phase: ${e.message}. Skipping.`));
                    continue;
                }

                let currentNonce = await web3Transfer.eth.getTransactionCount(account.address, "latest"); 

                console.log(cyan(`Processing wallet ${green(account.address)} on ${item.network.name}...\n`));

                try {
                    const gasPriceResult = await web3Transfer.eth.getGasPrice();
                    let currentBaseFeePerGas = BigInt(gasPriceResult || '0');

                    const maxPriorityFeePerGasGwei = 0.00065; 
                    const maxPriorityFeePerGasWei = BigInt(web3Transfer.utils.toWei(maxPriorityFeePerGasGwei.toString(), 'gwei'));
                    const maxFeePerGas = (currentBaseFeePerGas + maxPriorityFeePerGasWei) * 120n / 100n;

                    let gasLimit;
                    try {
                        const estimatedGasResult = await web3Transfer.eth.estimateGas({
                            from: account.address,
                            to: destinationAddress,
                            value: '1',
                        });
                        gasLimit = BigInt(Math.floor(Number(estimatedGasResult || '0') * 1.2));
                        if (gasLimit < 21000n) {
                            console.warn(yellow(`  Estimated Gas Limit (${gasLimit.toString()}) is unusually low. Using default 21000n.`));
                            gasLimit = 21000n;
                        }
                    } catch (estimateError) {
                        console.error(red(`  Could not estimate gas. Error: ${estimateError.message}`));
                        console.warn(yellow(`  Using default Gas Limit 21000n. Check RPC/network connectivity.`));
                        gasLimit = 21000n;
                    }

                    if (gasLimit === 0n || gasLimit === null || gasLimit === undefined) {
                         console.error(red(`  Critical Error: Estimated Gas Limit is invalid for ${account.address} on ${item.network.name}. Skipping this transfer.`));
                         continue; 
                    }

                    const currentBalanceWei = BigInt(await web3Transfer.eth.getBalance(account.address));
                    const estimatedTxCost = gasLimit * maxFeePerGas;

                    const safetyBuffer = BigInt(web3Transfer.utils.toWei('0.000001', 'ether'));
                    let amountToSend = currentBalanceWei - estimatedTxCost - safetyBuffer;
                    
                    if (amountToSend < 0n) {
                        console.error(red(`  🚨 Insufficient ${item.network.symbol} balance for gas. Have: ${web3Transfer.utils.fromWei(currentBalanceWei.toString(), 'ether')} ${item.network.symbol}, Needed for gas: ${web3Transfer.utils.fromWei(estimatedTxCost.toString(), 'ether')} ${item.network.symbol}. Skipping this transfer.`));
                        continue;
                    }

                    if (amountToSend <= 0n) {
                        console.warn(yellow(`  Skipping transfer for ${account.address} on ${item.network.name} as final amount to send is 0 or less ${item.network.symbol}.`));
                        continue;
                    }
                    
                    const tx = {
                        to: destinationAddress,
                        value: amountToSend.toString(),
                        gas: gasLimit.toString(),
                        maxFeePerGas: maxFeePerGas.toString(),
                        maxPriorityFeePerGas: maxPriorityFeePerGasWei.toString(),
                        nonce: currentNonce,
                        chainId: item.network.chainId,
                    };

                    const signedTx = await web3Transfer.eth.accounts.signTransaction(tx, item.privateKey);
                    const receipt = await web3Transfer.eth.sendSignedTransaction(signedTx.rawTransaction);

                    const explorerLink = item.network.explorer + '/tx/' + receipt.transactionHash; 
                    const transferredAmountDisplay = blue(web3Transfer.utils.fromWei(amountToSend.toString(), 'ether')) + ` ${item.network.symbol}`;

                    console.log(`  ✅ Transfer successful: ${transferredAmountDisplay} to ${green(destinationAddress)}: ${blue(explorerLink)}`);
                    currentNonce++;
                    await sleep(5);
                } catch (error) {
                    let errorMessage = `  ❌ Transfer failed for ${green(account.address)} on ${item.network.name} (${item.network.symbol}). Error: ${error.message}`;
                    if (error.message.includes("insufficient funds")) {
                        console.error(red(`${errorMessage}. Skipping this transfer due to INSUFFICIENT NATIVE FUNDS for gas.`));
                    } else if (error.message.includes("nonce already used") || error.message.includes("replacement transaction underpriced") || error.message.includes("transaction already imported")) {
                        console.error(red(`${errorMessage}. This often indicates a NONCE issue (transaction stuck or replayed).`));
                        console.error(yellow(`    Action: Verify wallet ${account.address} on ${item.network.explorer} for pending/failed transactions. Consider manually resetting nonce on wallet or waiting.`));
                    } else if (error.message.includes("timeout") || error.message.includes("network connection") || error.message.includes("Failed to fetch")) {
                        console.error(red(`${errorMessage}. This is likely a RPC/Network connectivity issue.`));
                        console.error(yellow(`    Action: Check your internet connection or try a different RPC URL for ${item.network.name} in listchaintestnet.txt.`));
                    }
                    else {
                        console.error(red(`${errorMessage}. Skipping this transfer.`));
                    }
                }
            }
            console.log(purple("\n=== All Automatic Transfers Completed ===\n"));
        } else {
            console.log(purple("\nAutomatic transfer cancelled. Exiting.\n"));
        }
    } else {
        console.log(purple("\nNo native token balances found across all wallets and networks. Exiting.\n"));
    }
    process.exit(0);
  }


  const networkChoiceIndex = parseInt(networkChoice.split(".")[0]) - 1;
  const { name, rpcUrl, chainId, symbol: networkSymbol, explorer: networkExplorer } = networks[networkChoiceIndex];

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
  let tokenSymbol = networkSymbol;

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
      tokenDecimals = Number(await tokenContract.methods.decimals().call());
      tokenSymbol = await tokenContract.methods.symbol().call();
      console.log(green(`Token detected: ${tokenSymbol} with ${tokenDecimals} decimals.\n`));

      console.log(purple("\n--- Current Token Balances ---\n"));
      for (const wallet of walletAccounts) {
        try {
          const tokenBalanceWei = await tokenContract.methods.balanceOf(wallet.account.address).call();
          const formattedBalance = formatTokenAmount(tokenBalanceWei, tokenDecimals);
          console.log(`Address ${green(wallet.account.address)}: ${blue(formattedBalance)} ${tokenSymbol}`);
        } catch (error) {
          console.log(purple(`Error fetching token balance for ${wallet.account.address}: ${error.message}`));
        }
      }
      console.log(purple("--- End Token Balances ---\n\n"));
    } catch (error) {
      console.log(purple(`Could not fetch token decimals or symbol. Assuming 18 decimals and default symbol. Error: ${error.message}`));
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
      type: "confirm",
      name: "useListAddresses",
      message: "Do you want to use addresses from listaddress.txt?",
      default: true,
    }
  ]);

  const { amount, transactionsCount, delay: txDelay, useListAddresses } = answers;

  const targetAddresses = useListAddresses
    ? (await fs.readFile("listaddress.txt", "utf-8")).split("\n").map(addr => addr.trim()).filter(addr => addr)
    : [];

  console.log(`\nYou have selected the network: ${cyan(name)}.`);
  console.log(`Total wallets to use: ${walletAccounts.length}`);
  console.log(`Total target addresses: ${targetAddresses.length || "Each wallet will send to itself"}`);

  for (const wallet of walletAccounts) {
    console.log(`\n🔄 Switching to Wallet ${wallet.account.address}\n`);

    let nonceForThisWallet = await web3.eth.getTransactionCount(wallet.account.address, "latest");

    for (let i = 0; i < (targetAddresses.length || 1); i++) {
      const toAddress = targetAddresses[i] || wallet.account.address;

      try {
        const code = await web3.eth.getCode(toAddress);
        if (code !== "0x") {
          console.log(`⚠️ Skipping contract address: ${toAddress}`);
          continue;
        }
      } catch (e) {
        console.log(`⚠️ Couldn't verify address type, continuing anyway...`);
      }

      for (let txIndex = 0; txIndex < transactionsCount; txIndex++) {
        console.log(`\n🚀 Sending transaction #${txIndex + 1} from ${green(wallet.account.address)} to ${cyan(toAddress)}...`);
        
        try {
            const gasPriceResult = await web3.eth.getGasPrice();
            let currentBaseFeePerGas = BigInt(gasPriceResult || '0');

            const maxPriorityFeePerGasGwei = 0.00065; 
            const maxPriorityFeePerGasWei = BigInt(web3.utils.toWei(maxPriorityFeePerGasGwei.toString(), 'gwei'));
            const maxFeePerGas = (currentBaseFeePerGas + maxPriorityFeePerGasWei) * 120n / 100n;

            let rawAmountToSend;
            let transaction;
            
            if (transferMode === "Native Coin (ETH/BNB/MATIC)") {
              let gasLimit;
              try {
                  const estimatedGasResult = await web3.eth.estimateGas({
                      from: wallet.account.address,
                      to: toAddress,
                      value: '1',
                  });
                  gasLimit = BigInt(Math.floor(Number(estimatedGasResult || '0') * 1.2));
                  if (gasLimit < 21000n) { 
                      console.warn(yellow(`  Estimated Gas Limit (${gasLimit.toString()}) is unusually low. Defaulting to 21000n.`));
                      gasLimit = 21000n;
                  }
              } catch (estimateError) {
                  console.error(red(`  Could not estimate gas. Error: ${estimateError.message}`));
                  console.warn(yellow(`  Using default Gas Limit 21000n. Check RPC/network connectivity.`));
                  gasLimit = 21000n;
              }

              if (gasLimit === 0n || gasLimit === null || gasLimit === undefined) {
                 console.error(red(`  Critical Error: Invalid Gas Limit for ${wallet.account.address} on ${name}. Skipping transaction.`));
                 continue;
              }

              const currentBalanceWei = BigInt(await web3.eth.getBalance(wallet.account.address));
              const estimatedTxCost = gasLimit * maxFeePerGas;

              if (amount.toLowerCase() === 'all') {
                  const safetyBuffer = BigInt(web3.utils.toWei('0.000001', 'ether'));
                  rawAmountToSend = currentBalanceWei - estimatedTxCost - safetyBuffer;

                  if (rawAmountToSend < 0n) {
                      console.error(red(`  🚨 Insufficient ${networkSymbol} balance for gas. Have: ${web3.utils.fromWei(currentBalanceWei.toString(), 'ether')} ${networkSymbol}, Needed for gas: ${web3.utils.fromWei(estimatedTxCost.toString(), 'ether')} ${networkSymbol}. Skipping transaction.`));
                      continue;
                  }
              } else {
                  rawAmountToSend = BigInt(web3.utils.toWei(amount, "ether"));
                  if (currentBalanceWei < (rawAmountToSend + estimatedTxCost)) {
                      console.error(red(`  🚨 Insufficient ${networkSymbol} balance for amount and gas. Have: ${web3.utils.fromWei(currentBalanceWei.toString(), 'ether')} ${networkSymbol}, Want: ${web3.utils.fromWei(rawAmountToSend.toString(), 'ether')} ${networkSymbol} + ${web3.utils.fromWei(estimatedTxCost.toString(), 'ether')} ${networkSymbol} for gas. Skipping transaction.`));
                      continue;
                  }
              }
              
              if (rawAmountToSend <= 0n) {
                  console.warn(yellow(`  Skipping transaction for ${wallet.account.address} as final amount to send is 0 or less ${networkSymbol}.`));
                  continue;
              }

              transaction = {
                to: toAddress,
                value: rawAmountToSend.toString(),
                gas: gasLimit.toString(),
                maxFeePerGas: maxFeePerGas.toString(),
                maxPriorityFeePerGas: maxPriorityFeePerGasWei.toString(),
                nonce: nonceForThisWallet,
                chainId: chainId,
              };
            } else {
              let tokenContract = new web3.eth.Contract(ERC20_ABI, tokenContractAddress);
              let currentTokenBalanceWei = BigInt(await tokenContract.methods.balanceOf(wallet.account.address).call() || '0');
              rawAmountToSend = amount.toLowerCase() === 'all' ? currentTokenBalanceWei : BigInt(web3.utils.toWei(amount, 'ether'));

              if (rawAmountToSend === 0n) {
                  console.warn(yellow(`  Skipping transaction for ${wallet.account.address} on ${name} (${tokenSymbol}) as final amount to send is 0.`));
                  continue;
              }
              if (rawAmountToSend > currentTokenBalanceWei) {
                 console.error(red(`  🚨 Insufficient token balance for ${wallet.account.address}. Requested ${amount} ${tokenSymbol}, but only have ${formatTokenAmount(currentTokenBalanceWei.toString(), tokenDecimals)} ${tokenSymbol}. Skipping transaction.`));
                 continue;
              }

              try {
                  const estimatedGasResult = await web3.eth.estimateGas({
                      from: wallet.account.address,
                      to: tokenContractAddress,
                      data: tokenContract.methods.transfer(toAddress, rawAmountToSend.toString()).encodeABI(),
                  });
                  gasLimit = BigInt(Math.floor(Number(estimatedGasResult || '0') * 1.2));
                  if (gasLimit < 50000n) { 
                      console.warn(yellow(`  Estimated Gas Limit (${gasLimit.toString()}) is unusually low for ERC20. Defaulting to 100000n.`));
                      gasLimit = 100000n;
                  }
              } catch (estimateError) {
                  console.error(red(`  Could not estimate gas for ERC20. Error: ${estimateError.message}`));
                  console.warn(yellow(`  Using default Gas Limit 100000n. Check RPC/network connectivity.`));
                  gasLimit = 100000n;
              }

              if (gasLimit === 0n || gasLimit === null || gasLimit === undefined) {
                 console.error(red(`  Critical Error: Invalid Gas Limit for ERC20 transfer from ${wallet.account.address} on ${name}. Skipping transaction.`));
                 continue;
              }

              const nativeBalanceForGas = BigInt(await web3.eth.getBalance(wallet.account.address));
              const estimatedGasCostForTokenTx = gasLimit * maxFeePerGas;

              if (nativeBalanceForGas < estimatedGasCostForTokenTx) {
                  console.error(red(`  🚨 Insufficient ${networkSymbol} (native token) for gas to send ${tokenSymbol}. Have: ${web3.utils.fromWei(nativeBalanceForGas.toString(), 'ether')} ${networkSymbol}, Needed for gas: ${web3.utils.fromWei(estimatedGasCostForTokenTx.toString(), 'ether')} ${networkSymbol}. Skipping this token transfer.`));
                  continue;
              }

              transaction = {
                  to: tokenContractAddress,
                  data: tokenContract.methods.transfer(toAddress, rawAmountToSend.toString()).encodeABI(),
                  gas: gasLimit.toString(),
                  maxFeePerGas: maxFeePerGas.toString(),
                  maxPriorityFeePerGas: maxPriorityFeePerGasWei.toString(),
                  nonce: nonceForThisWallet,
                  chainId: chainId,
                  value: '0x0'
              };
            }

            if (!transaction || typeof transaction.gas === 'undefined' || typeof transaction.maxFeePerGas === 'undefined') {
                console.error(red(`Critical Error: Transaction object not fully formed for ${wallet.account.address} on ${name}. Skipping.`));
                continue;
            }

            const signedTx = await web3.eth.accounts.signTransaction(transaction, wallet.privateKey);
            const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

            const explorerLink = networkExplorer ? networkExplorer + '/tx/' + receipt.transactionHash : `Transaction Hash: ${receipt.transactionHash} on ${name}`;
            if (!networkExplorer) {
                console.warn(yellow(`Warning: Explorer link not found for network ${name}. Displaying transaction hash only.`));
            }

            let transferredAmountDisplay;
            if (transferMode === 'Native Coin (ETH/BNB/MATIC)') {
                transferredAmountDisplay = blue(web3.utils.fromWei(rawAmountToSend.toString(), 'ether')) + ` ${networkSymbol}`;
            } else {
                transferredAmountDisplay = blue(formatTokenAmount(rawAmountToSend.toString(), tokenDecimals)) + ` ${tokenSymbol}`;
            }

            console.log(`  ✅ Transfer successful: ${transferredAmountDisplay} to ${green(toAddress)}: ${blue(explorerLink)}`);
            nonceForThisWallet++;
            if (txDelay > 0) {
              console.log(`⏳ Waiting for ${txDelay} seconds before next transaction...\n`);
              await sleep(txDelay);
            }
          } catch (error) {
            let errorMessage = `  ❌ Transaction failed from ${green(wallet.account.address)} to ${cyan(toAddress)}. Error: ${error.message}`;
            if (error.message.includes("insufficient funds")) {
                console.error(red(`${errorMessage}. Skipping this transaction due to INSUFFICIENT NATIVE FUNDS for gas.\n`));
            } else if (error.message.includes("nonce already used") || error.message.includes("replacement transaction underpriced") || error.message.includes("transaction already imported")) {
                console.error(red(`${errorMessage}. This often indicates a NONCE issue (transaction stuck or replayed).`));
                console.error(yellow(`    ACTION: Verify wallet ${wallet.account.address} on ${name}'s explorer. If a transaction is stuck, clear it or adjust nonce. Restarting the script might help.`));
            } else if (error.message.includes("timeout") || error.message.includes("network connection") || error.message.includes("Failed to fetch") || error.message.includes("JSON RPC response")) {
                console.error(red(`${errorMessage}. This is likely a RPC/NETWORK CONNECTIVITY issue.`));
                console.error(yellow(`    ACTION: Check your internet connection or try a different RPC URL for ${name} in listchaintestnet.txt. A public RPC might be unstable.`));
            } else if (error.message.includes("Transaction has been reverted by the EVM")) {
                console.error(red(`${errorMessage}. EVM reverted the transaction.`));
                console.error(yellow(`    ACTION: For native transfers, this is usually a nonce or very specific RPC issue. Ensure the destination address is valid. For contract interactions, check contract logic.`));
            }
            else {
                console.error(red(`${errorMessage}. Skipping this transaction.\n`));
            }
          }
      }
    }
  }

  console.log(purple("🎉 === All transactions completed ===\n"));
  for (const wallet of walletAccounts) { 
    try {
      const account = wallet.account; 
      if (transferMode === "Native Coin (ETH/BNB/MATIC)") {
        const balance = await web3.eth.getBalance(account.address);
        console.log(`\nFinal balance of sender ${green(account.address)}: ${blue(web3.utils.fromWei(balance, "ether"))} ${networkSymbol}\n`);
      } else {
        let tokenContract = new web3.eth.Contract(ERC20_ABI, tokenContractAddress);
        const tokenBalanceWei = await tokenContract.methods.balanceOf(account.address).call();
        const formattedBalance = formatTokenAmount(tokenBalanceWei, tokenDecimals);
        console.log(`\nFinal balance of sender ${green(account.address)}: ${blue(formattedBalance)} ${tokenSymbol}\n`);
      }
    } catch (error) {
        console.error(red(`Error fetching final balance for ${wallet.account.address}: ${error.message}\n`));
    }
  }
};

main().catch(async (error) => {
  console.log(red(`Unexpected fatal error occurred. Error: ${error.message}\n`));
  process.exit(1);
});
