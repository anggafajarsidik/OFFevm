import Web3 from 'web3';
import fs from 'fs/promises';
import inquirer from 'inquirer';

// Function to introduce a delay (in seconds)
const sleep = (seconds) => new Promise(resolve => setTimeout(resolve, seconds * 1000));

// Function to print in purple color
const purple = (text) => `\x1b[35m${text}\x1b[0m`;

// Function to print in blue color
const blue = (text) => `\x1b[34m${text}\x1b[0m`;

// Function to print in green color
const green = (text) => `\x1b[32m${text}\x1b[0m`;

// Mapping chain IDs to explorer URLs
const explorerMap = {
  1: 'https://etherscan.io/tx/',
  56: 'https://bscscan.com/tx/',
  137: 'https://polygonscan.com/tx/',
  42161: 'https://arbiscan.io/tx/',
  10: 'https://optimistic.etherscan.io/tx/',
  324: 'https://explorer.zksync.io/tx/',
  8453: 'https://basescan.org/tx/'
};

// Custom ASCII art logo
const createdByLogo = `
 ██████╗ ███████╗███████╗    ███████╗ █████╗ ███╗   ███╗██╗██╗  ██╗   ██╗
██╔═══██╗██╔════╝██╔════╝    ██╔════╝██╔══██╗████╗ ████║██║██║  ╚██╗ ██╔╝
██║   ██║█████╗  █████╗      █████╗  ███████║██╔████╔██║██║██║   ╚████╔╝ 
██║   ██║██╔══╝  ██╔══╝      ██╔══╝  ██╔══██║██║╚██╔╝██║██║██║    ╚██╔╝  
╚██████╔╝██║     ██║         ██║     ██║  ██║██║ ╚═╝ ██║██║███████╗██║   
 ╚═════╝ ╚═╝     ╚═╝         ╚═╝     ╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚══════╝╚═╝   
`;
const creativeMessage = `
We’re here to make blockchain easier and better.
`;

const main = async () => {
  console.log(purple("=== Starting the process ==="));
  console.log(purple("Script created by:"));
  console.log(purple(createdByLogo));
  console.log(purple(creativeMessage));

  // Load configurations
  const privateKeys = (await fs.readFile("YourPrivateKey.txt", "utf-8"))
    .split("\n")
    .map(key => key.trim())
    .filter(key => key);

  // Add '0x' prefix if not present and validate private keys
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

  // Prompt user for network choice
  const { networkChoice } = await inquirer.prompt([
    {
      type: "list",
      name: "networkChoice",
      message: "Pick the network you want to use:",
      choices: networks.map((net, index) => `${index + 1}. ${net.name}`),
    },
  ]);

  // Parse the network choice
  const networkChoiceIndex = parseInt(networkChoice.split(".")[0]) - 1;
  const { name, rpcUrl, chainId, symbol } = networks[networkChoiceIndex];

  // Display wallet details
  console.log(purple(`\nConnecting to the ${name} network...`));
  const web3 = new Web3(rpcUrl);

  // Prompt user for further actions
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "amount",
      message: "Enter the amount to send (in ETH or token unit):",
      validate: input => !isNaN(parseFloat(input)) && parseFloat(input) > 0,
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
      validate: input => /^0x[a-fA-F0-9]{40}$/.test(input) || "Please enter a valid Ethereum address.",
    },
  ]);

  const { amount, transactionsCount, delay, useListAddresses, singleAddress } = answers;
  const targetAddresses = useListAddresses
    ? (await fs.readFile("listaddress.txt", "utf-8")).split("\n").map(addr => addr.trim()).filter(addr => addr)
    : [singleAddress];

  console.log(`\nSelected Network: ${name}`);
  console.log(`Number of Addresses to Send To: ${targetAddresses.length}`);

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
            gasPrice: gasPrice,
            nonce: nonce,
            chainId: chainId,
          };

          const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
          const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

          // Generate the explorer link for the transaction
          const explorerLink = explorerMap[chainId] + receipt.transactionHash;

          // Color the address and link
          console.log(`Transaction to ${green(toAddress)} successful: ${blue(explorerLink)}`);
          nonce++;
          if (delay > 0) await sleep(delay);
        } catch (error) {
          console.error(`Error in transaction: ${error.message}`);
        }
      }
    }

    // Display final balance after transactions
    try {
      const balance = await web3.eth.getBalance(account.address);
      console.log(`\nFinal balance of sender ${green(account.address)}: ${blue(web3.utils.fromWei(balance, "ether"))} ${symbol}`);
    } catch (error) {
      console.error(`Error fetching final balance: ${error.message}`);
    }
  }

  console.log(purple("\n=== All transactions completed ==="));
};

main().catch(error => console.error("An error occurred:", error.message));
