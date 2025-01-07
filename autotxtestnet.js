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

// Function to print in cyan color
const cyan = (text) => `\x1b[36m${text}\x1b[0m`;

// Custom "Script Created by" logo in ASCII art
const createdByLogo = `
${purple(`
 ██████╗ ███████╗███████╗    ███████╗ █████╗ ███╗   ███╗██╗██╗  ██╗   ██╗
██╔═══██╗██╔════╝██╔════╝    ██╔════╝██╔══██╗████╗ ████║██║██║  ╚██╗ ██╔╝
██║   ██║█████╗  █████╗      █████╗  ███████║██╔████╔██║██║██║   ╚████╔╝ 
██║   ██║██╔══╝  ██╔══╝      ██╔══╝  ██╔══██║██║╚██╔╝██║██║██║    ╚██╔╝  
╚██████╔╝██║     ██║         ██║     ██║  ██║██║ ╚═╝ ██║██║███████╗██║   
 ╚═════╝ ╚═╝     ╚═╝         ╚═╝     ╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚══════╝╚═╝   
`)}
`;

// Simple, direct message
const creativeMessage = `\n${purple(`We’re here to make blockchain easier and better.`)}\n`;

// Function to fetch with timeout
const fetchWithTimeout = (promise, timeoutMs) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout exceeded")), timeoutMs))
  ]);
};

const main = async () => {
  // Clear the terminal
  console.clear();

  console.log(purple("=== Starting the process ==="));
  console.log(purple("Script created by:"));
  console.log(createdByLogo);
  console.log(creativeMessage);

  // Load configurations
  const privateKeys = (await fs.readFile("YourPrivateKey.txt", "utf-8"))
    .split("\n")
    .map(key => key.trim())
    .filter(key => key);
  const networks = JSON.parse(await fs.readFile("listchaintestnet.txt", "utf-8"));

  // Prompt user for required inputs
  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "networkChoice",
      message: "Pick the network you want to use:",
      choices: networks.map((net, index) => `${index + 1}. ${net.name}`),
    },
    {
      type: "input",
      name: "amount",
      message: "Enter the amount to send (in ETH or token unit):",
      validate: input => !isNaN(parseFloat(input)) && parseFloat(input) > 0,
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

  // Parse the network choice
  const networkChoiceIndex = parseInt(answers.networkChoice.split(".")[0]) - 1;
  const { name, rpcUrl, chainId, symbol, explorer } = networks[networkChoiceIndex];
  const { amount, transactionsCount, delay, useListAddresses, singleAddress } = answers;

  // Load addresses from listaddress.txt if needed
  const targetAddresses = useListAddresses
    ? (await fs.readFile("listaddress.txt", "utf-8")).split("\n").map(addr => addr.trim()).filter(addr => addr)
    : [singleAddress];

  console.log(`\nYou have selected the network: ${cyan(name)}.`);

  // Loop through all private keys (wallets)
  for (const privateKey of privateKeys) {
    const web3 = new Web3(rpcUrl);
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);

    let nonce = await fetchWithTimeout(web3.eth.getTransactionCount(account.address, "pending"), 5000);

    for (let i = 0; i < transactionsCount; i++) {
      console.log(`\nSending transaction #${i + 1} from wallet with private key ${privateKey.slice(0, 6)}...`);

      try {
        const gasPrice = await fetchWithTimeout(web3.eth.getGasPrice(), 5000);

        // Loop through all target addresses
        for (const toAddress of targetAddresses) {
          const amountInWei = web3.utils.toWei(amount, "ether");
          const gasEstimate = await web3.eth.estimateGas({
            from: account.address,
            to: toAddress,
            value: amountInWei,
          });

          const tx = {
            to: toAddress,
            value: amountInWei,
            gas: Math.ceil(gasEstimate * 1.2), // Increase gas limit by 20%
            gasPrice: BigInt(gasPrice) * BigInt(2), // Increase gas price (2x)
            nonce: nonce,
            chainId: chainId,
          };

          const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
          const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

          console.log(`Transaction successful: ${blue(`${explorer}/tx/${receipt.transactionHash}`)}`);
          nonce++;
          if (delay > 0) await sleep(delay);
        }
      }
