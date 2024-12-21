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

  let totalTransactions = 0;
  let successfulTransactions = 0;
  let failedTransactions = 0;
  let totalGasUsed = 0;

  for (const privateKey of privateKeys) {
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    let nonce = await web3.eth.getTransactionCount(account.address, "latest");
    const balanceBefore = await web3.eth.getBalance(account.address);

    // Simulate transactions (replace with real logic)
    for (let i = 0; i < 5; i++) { // Example loop
      try {
        // Example dummy transaction
        const gasUsed = Math.floor(Math.random() * 21000) + 21000; // Simulate gas usage
        totalGasUsed += gasUsed;
        successfulTransactions++;
        console.log(green(`Transaction #${i + 1} succeeded.`));
      } catch {
        failedTransactions++;
        console.error(`Transaction #${i + 1} failed.`);
      }
      totalTransactions++;
    }

    const balanceAfter = await web3.eth.getBalance(account.address);
    console.log(purple(`\nWallet ${green(account.address)}:`));
    console.log(`Balance before: ${blue(web3.utils.fromWei(balanceBefore, "ether"))} ${symbol}`);
    console.log(`Balance after: ${blue(web3.utils.fromWei(balanceAfter, "ether"))} ${symbol}`);
  }

  console.log(purple("\n=== Transaction Summary ==="));
  console.log(`Total Transactions: ${totalTransactions}`);
  console.log(`Successful Transactions: ${green(successfulTransactions)}`);
  console.log(`Failed Transactions: ${failedTransactions}`);
  console.log(`Total Gas Used: ${totalGasUsed}`);
};

main().catch(error => console.error("An error occurred:", error.message));
