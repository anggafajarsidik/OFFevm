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

// Custom "Created By" logo in ASCII art
const createdByLogo = `
 ██████╗ ███████╗███████╗    ██████╗ ██████╗  ██████╗      ██╗███████╗ ██████╗████████╗
██╔═══██╗██╔════╝██╔════╝    ██╔══██╗██╔══██╗██╔═══██╗     ██║██╔════╝██╔════╝╚══██╔══╝
██║   ██║█████╗  █████╗      ██████╔╝██████╔╝██║   ██║     ██║█████╗  ██║        ██║   
██║   ██║██╔══╝  ██╔══╝      ██╔═══╝ ██╔══██╗██║   ██║██   ██║██╔══╝  ██║        ██║   
╚██████╔╝██║     ██║         ██║     ██║  ██║╚██████╔╝╚█████╔╝███████╗╚██████╗   ██║   
 ╚═════╝ ╚═╝     ╚═╝         ╚═╝     ╚═╝  ╚═╝ ╚═════╝  ╚════╝ ╚══════╝ ╚═════╝   ╚═╝   
`;

const main = async () => {
  console.log(purple("=== Starting Transactions on Mainnet ==="));
  console.log(purple("Script created by:"));
  console.log(purple(createdByLogo));

  // Load configurations
  const privateKeys = (await fs.readFile("YourPrivateKey.txt", "utf-8")).split("\n").map(key => key.trim()).filter(key => key);
  const networks = JSON.parse(await fs.readFile("listchainmainnet.txt", "utf-8"));

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
      message: "How many transactions do you want to send?",
      validate: input => !isNaN(parseInt(input)) && parseInt(input) > 0,
    },
    {
      type: "input",
      name: "delay",
      message: "How much delay (in seconds) between transactions?",
      validate: input => !isNaN(parseInt(input)) && parseInt(input) >= 0,
    },
  ]);

  // Parse the network choice
  const networkChoiceIndex = parseInt(answers.networkChoice.split(".")[0]) - 1;
  const { name, rpcUrl, chainId } = networks[networkChoiceIndex];
  const { amount, transactionsCount, delay } = answers;

  // Load addresses from listaddress.txt
  const targetAddresses = (await fs.readFile("listaddress.txt", "utf-8")).split("\n").map(addr => addr.trim()).filter(addr => addr);

  console.log(`\nYou have selected the ${name} network.`);

  // Ensure private keys are correctly formatted
  privateKeys.forEach(key => {
    if (!/^([a-fA-F0-9]{64})$/.test(key)) {
      console.error(`Invalid private key format: ${key}`);
      process.exit(1);
    }
  });

  // Add '0x' prefix to private keys if not present
  const privateKeysWithPrefix = privateKeys.map(key => key.startsWith("0x") ? key : `0x${key}`);

  // Loop through all private keys (wallets)
  for (const privateKey of privateKeysWithPrefix) {
    const web3 = new Web3(rpcUrl);
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);

    // Get the initial nonce for the wallet
    let nonce = await web3.eth.getTransactionCount(account.address, "latest");

    // Loop through the number of transactions the user wants to send
    for (let i = 0; i < transactionsCount; i++) {
      console.log(`\nSending transaction #${i + 1} from wallet ${green(account.address)}...`);

      try {
        const gasPrice = await web3.eth.getGasPrice();

        // Loop through all target addresses
        for (const toAddress of targetAddresses) {
          const tx = {
            to: toAddress, // Current target address
            value: web3.utils.toWei(amount, "ether"),
            gas: 21000,
            gasPrice: gasPrice,
            nonce: nonce,
            chainId: chainId,
          };

          const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
          const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

          console.log(`Transaction to ${green(toAddress)} successful: ${blue(receipt.transactionHash)}`);
          nonce++;
        }

        // Wait for the specified delay before the next transaction
        if (delay > 0) {
          console.log(`Waiting for ${delay} seconds before sending the next transaction...`);
          await sleep(delay);
        }
      } catch (error) {
        console.error(`Error sending transaction #${i + 1}:`, error.message);
      }
    }
  }

  console.log(purple("=== All Mainnet transactions completed ==="));
};

main().catch(error => {
  console.error("An error occurred:", error.message);
});
