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
      choices: networks.map((net, index) => `${index + 1}. ${net.name}`),
    },
  ]);

  const networkChoiceIndex = parseInt(networkChoice.split(".")[0]) - 1;
  const { name, rpcUrl, chainId, explorer, symbol: nativeSymbol } = networks[networkChoiceIndex];

  await typeOut(purple(`\nConnecting to the ${name} network...\n`), 10);
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
  let tokenSymbol = nativeSymbol; 

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
          const formattedBalance = web3.utils.fromWei(tokenBalanceWei, 'ether');
          await typeOut(`Address ${green(account.address)}: ${blue(parseFloat(formattedBalance).toFixed(tokenDecimals > 18 ? 18 : tokenDecimals))} ${tokenSymbol}\n`, 1);
        } catch (error) {
          await typeOut(purple(`Error fetching token balance for ${account.address}: ${error.message}\n`), 1);
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
  const networkChoiceIndex_again = parseInt(answers.networkChoice.split(".")[0]) - 1; 
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
            let currentBaseFeePerGas = web3.utils.toBN(gasPriceResult);
            
            const maxPriorityFeePerGas = web3.utils.toBN(web3.utils.toWei('0.01', 'gwei')); 
            
            const maxFeePerGas = currentBaseFeePerGas.add(maxPriorityFeePerGas).mul(web3.utils.toBN(120)).div(web3.utils.toBN(100));

            let rawAmountToSend;
            let transaction;

            if (transferMode === "Native Coin (ETH/BNB/MATIC)") {
              let gasLimit = web3.utils.toBN(21000); // Default gas limit for native transfer

              if (amount.toLowerCase() === 'all') {
                const currentBalance = web3.utils.toBN(await web3Instance.eth.getBalance(account.address));
                const estimatedTxCost = gasLimit.mul(maxFeePerGas);
                rawAmountToSend = currentBalance.sub(estimatedTxCost);
                
                if (rawAmountToSend.lt(web3.utils.toBN('0'))) {
                  await typeOut(purple(`Insufficient ${nativeSymbol} balance for gas on ${account.address}. Skipping transaction.\n`), 5);
                  continue; 
                }
              } else {
                rawAmountToSend = web3.utils.toBN(web3.utils.toWei(amount, "ether"));
              }

              try {
                const estimatedGas = await web3Instance.eth.estimateGas({
                  from: account.address,
                  to: toAddress,
                  value: rawAmountToSend.toString(),
                });
                gasLimit = web3.utils.toBN(Math.floor(parseInt(estimatedGas) * 1.2)); 
                await typeOut(blue(`Estimated Gas Limit for Native Coin to ${toAddress}: ${gasLimit.toString()}\n`), 1);
              } catch (estimateError) {
                await typeOut(purple(`Could not estimate gas for Native Coin to ${toAddress}. Using default 21000. Error: ${estimateError.message}\n`), 5);
                gasLimit = web3.utils.toBN(21000);
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
                  await typeOut(purple(`Skipping transaction for ${account.address} as token balance is 0 ${tokenSymbol}.\n`), 5);
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
                    await typeOut(purple(`Warning: Input amount has more decimal places than the token's decimals. Truncating to ${tokenDecimals} decimals.\n`), 5);
                    fullAmountString = integerPart + decimalPart.substring(0, tokenDecimals);
                    numDecimalsInInput = tokenDecimals;
                }
                
                const remainingZerosToPad = tokenDecimals - numDecimalsInInput;
                const finalAmountString = fullAmountString + '0'.repeat(remainingZerosToPad);
                
                tokenAmountWei = web3.utils.toBN(finalAmountString);
                
                if (tokenAmountWei.gt(web3.utils.toBN(currentTokenBalanceWei))) {
                    await typeOut(purple(`Insufficient token balance for ${account.address}. Requested ${amount} ${tokenSymbol}, but only have ${web3.utils.fromWei(currentTokenBalanceWei, 'ether')} ${tokenSymbol}. Skipping transaction.\n`), 5);
                    continue; 
                }
              }
              
              const data = tokenContract.methods.transfer(toAddress, tokenAmountWei.toString()).encodeABI(); 

              let gasLimit;
              try {
                  gasLimit = await web3Instance.eth.estimateGas({
                      from: account.address,
                      to: tokenContractAddress,
                      data: data,
                  });
                  gasLimit = web3.utils.toBN(Math.floor(parseInt(gasLimit) * 1.2));
                  await typeOut(blue(`Estimated Gas Limit for ERC20 to ${toAddress}: ${gasLimit.toString()}\n`), 1);
              } catch (estimateError) {
                  await typeOut(purple(`Could not estimate gas for ERC20 to ${toAddress}. Using default 100000. Error: ${estimateError.message}\n`), 5);
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

            const signedTx = await web3Instance.eth.accounts.signTransaction(transaction, privateKey);
            const receipt = await web3Instance.eth.sendSignedTransaction(signedTx.rawTransaction);
            await typeOut(`✅ Transaction successful: ${blue(`${explorer}/tx/${receipt.transactionHash}`)}\n`, 5);
            success = true;

            if (txDelay > 0) {
              await typeOut(`⏳ Waiting for ${txDelay} seconds before next transaction...\n`, 5);
              await sleep(txDelay);
            }
          } catch (error) {
            await typeOut(`❌ Transaction failed from ${green(account.address)} to ${cyan(toAddress)}, retrying in ${retryDelay} seconds... Error: ${error.message}\n`, 5);
            await sleep(retryDelay);
          }
        }
      }
    }
  }

  await typeOut(purple("🎉 === All transactions completed ===\n"), 5);
  for (const privateKey of privateKeys) {
    try {
      const account = web3Instance.eth.accounts.privateKeyToAccount(privateKey);
      if (transferMode === "Native Coin (ETH/BNB/MATIC)") {
        const balance = await web3Instance.eth.getBalance(account.address);
        await typeOut(`\nFinal balance of sender ${green(account.address)}: ${blue(web3.utils.fromWei(balance, "ether"))} ${nativeSymbol}\n`, 5);
      } else { 
        const tokenBalanceWei = await tokenContract.methods.balanceOf(account.address).call();
        const tokenBalance = parseFloat(web3.utils.fromWei(tokenBalanceWei, 'ether')).toFixed(tokenDecimals > 18 ? 18 : tokenDecimals);
        await typeOut(`\nFinal balance of sender ${green(account.address)}: ${blue(tokenBalance)} ${tokenSymbol}\n`, 5);
      }
    } catch (error) {
      await typeOut(`Error fetching final balance: ${error.message}\n`, 5);
    }
  }
};

main().catch(async (error) => {
  await typeOut(`Unexpected error occurred. Retrying main loop... Error: ${error.message}\n`, 5);
  await sleep(5);
  main();
});
