import Web3 from 'web3';
import fs from 'fs/promises';
import inquirer from 'inquirer';

// Utility functions
const sleep = (seconds) => new Promise((resolve) => setTimeout(resolve, seconds * 1000));
const colorize = (text, colorCode) => `\x1b[${colorCode}m${text}\x1b[0m`;
const purple = (text) => colorize(text, 35);
const blue = (text) => colorize(text, 34);
const green = (text) => colorize(text, 32);
const red = (text) => colorize(text, 31);

// Chain explorer mapping
const explorerMap = {
  1: 'https://etherscan.io/tx/',
  56: 'https://bscscan.com/tx/',
  137: 'https://polygonscan.com/tx/',
  42161: 'https://arbiscan.io/tx/',
  10: 'https://optimistic.etherscan.io/tx/',
  324: 'https://explorer.zksync.io/tx/',
  8453: 'https://basescan.org/tx/',
};

// Logo
const createdByLogo = `
███████╗ █████╗ ███╗   ███╗██╗██╗  ██╗   ██╗
██╔════╝██╔══██╗████╗ ████║██║██║  ╚██╗ ██╔╝
█████╗  ███████║██╔████╔██║██║██║   ╚████╔╝ 
██╔══╝  ██╔══██║██║╚██╔╝██║██║██║    ╚██╔╝  
██║     ██║  ██║██║ ╚═╝ ██║██║███████╗██║   
╚═╝     ╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚══════╝╚═╝   
`;

const main = async () => {
  console.log(purple("=== Blockchain Utility Script ==="));
  console.log(purple(createdByLogo));
  console.log(green("Designed to simplify blockchain transactions."));

  try {
    // Load private keys
    const privateKeys = (await fs.readFile("YourPrivateKey.txt", "utf-8"))
      .split("\n")
      .map((key) => key.trim())
      .filter((key) => key);

    // Validate and normalize private keys
    privateKeys.forEach((key, index) => {
      if (!/^0x[a-fA-F0-9]{64}$/.test(key)) {
        if (/^[a-fA-F0-9]{64}$/.test(key)) {
          privateKeys[index] = `0x${key}`;
        } else {
          throw new Error(`Invalid private key format: ${key}`);
        }
      }
    });

    // Load network configurations
    const networks = JSON.parse(await fs.readFile("listchainmainnet.txt", "utf-8"));

    // Prompt user for network choice
    const { networkChoice } = await inquirer.prompt([
      {
        type: "list",
        name: "networkChoice",
        message: "Pick the network you want to use:",
        choices: networks.map((net, index) => `${index + 1}. ${net.name}`),
      },
    ]);

    // Extract selected network details
    const networkIndex = parseInt(networkChoice.split(".")[0]) - 1;
    const { name, rpcUrl, chainId, symbol } = networks[networkIndex];

    console.log(purple(`\nConnecting to the ${name} network...`));
    const web3 = new Web3(rpcUrl);

    // Prompt user for transaction details
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "amount",
        message: "Enter the amount to send (in ETH or token unit):",
        validate: (input) => !isNaN(parseFloat(input)) && parseFloat(input) > 0,
      },
      {
        type: "input",
        name: "transactionsCount",
        message: "Enter number of transactions per address:",
        validate: (input) => !isNaN(parseInt(input)) && parseInt(input) > 0,
      },
      {
        type: "input",
        name: "delay",
        message: "How much delay (in seconds) between transactions?",
        validate: (input) => !isNaN(parseInt(input)) && parseInt(input) >= 0,
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
        validate: (input) => /^0x[a-fA-F0-9]{40}$/.test(input) || "Please enter a valid Ethereum address.",
      },
    ]);

    const { amount, transactionsCount, delay, useListAddresses, singleAddress } = answers;

    // Determine target addresses
    const targetAddresses = useListAddresses
      ? (await fs.readFile("listaddress.txt", "utf-8"))
          .split("\n")
          .map((addr) => addr.trim())
          .filter((addr) => addr)
      : [singleAddress];

    console.log(green(`Network: ${name}`));
    console.log(green(`Number of Addresses: ${targetAddresses.length}`));

    // Display initial balances
    for (const privateKey of privateKeys) {
      const account = web3.eth.accounts.privateKeyToAccount(privateKey);
      const balance = await web3.eth.getBalance(account.address);
      console.log(`Balance of ${green(account.address)}: ${blue(web3.utils.fromWei(balance, "ether"))} ${symbol}`);
    }

    // Process transactions
    for (const privateKey of privateKeys) {
      const account = web3.eth.accounts.privateKeyToAccount(privateKey);
      let nonce = await web3.eth.getTransactionCount(account.address, "latest");

      for (let i = 0; i < transactionsCount; i++) {
        for (const toAddress of targetAddresses) {
          try {
            const gasPrice = await web3.eth.getGasPrice();
            const tx = {
              to: toAddress,
              value: web3.utils.toWei(amount, "ether"),
              gas: 21000,
              gasPrice,
              nonce,
              chainId,
            };

            const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
            const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
            const explorerLink = explorerMap[chainId] + receipt.transactionHash;

            console.log(`Transaction to ${green(toAddress)} successful: ${blue(explorerLink)}`);
            nonce++;
            if (delay > 0) await sleep(delay);
          } catch (error) {
            console.error(red(`Transaction error: ${error.message}`));
          }
        }
      }
    }

    console.log(purple("\n=== Transactions Complete ==="));

    // Final balance display
    for (const privateKey of privateKeys) {
      const account = web3.eth.accounts.privateKeyToAccount(privateKey);
      const balance = await web3.eth.getBalance(account.address);
      console.log(`Final balance of ${green(account.address)}: ${blue(web3.utils.fromWei(balance, "ether"))} ${symbol}`);
    }
  } catch (error) {
    console.error(red(`Error: ${error.message}`));
  }
};

main();
