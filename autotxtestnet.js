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
`)}`;

const creativeMessage = `
${purple(`We’re here to make blockchain easier and better.`)}
`;

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

  // Add '0x' prefix to private keys if not present
  const privateKeysWithPrefix = privateKeys.map(key => key.startsWith("0x") ? key : `0x${key}`);

  for (const privateKey of privateKeysWithPrefix) {
    const web3 = new Web3(rpcUrl);
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);

    // Fetch initial nonce
    let nonce = await web3.eth.getTransactionCount(account.address, "pending");

    for (let i = 0; i < transactionsCount; i++) {
      console.log(`\nSending transaction #${i + 1} from wallet with private key ${privateKey.slice(0, 6)}...`);

      try {
        const gasPrice = BigInt(await web3.eth.getGasPrice()) * 2n; // Double the gas price for faster processing

        for (const toAddress of targetAddresses) {
          const amountInWei = BigInt(web3.utils.toWei(amount, "ether"));
          const gasLimit = BigInt(21000); // Standard gas limit for ETH transfer

          const tx = {
            to: toAddress,
            value: amountInWei,
            gas: gasLimit,
            gasPrice: gasPrice,
            nonce: nonce,
            chainId: chainId,
          };

          const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
          const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

          const explorerLink = `${explorer}/tx/${receipt.transactionHash}`;
          console.log(`Transaction to ${green(toAddress)} successful: ${blue(explorerLink)}`);

          nonce++;
          if (delay > 0) {
            console.log(`Waiting for ${delay} seconds before sending the next transaction...`);
            await sleep(delay);
          }
        }
      } catch (error) {
        console.error(`Error sending transaction #${i + 1}:`, error.message);
      }
    }
  }

  console.log(purple("=== All transactions completed ==="));
};

main().catch(error => {
  console.error("An error occurred:", error.message);
});
