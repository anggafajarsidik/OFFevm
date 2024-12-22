import Web3 from 'web3';
import fs from 'fs/promises';
import inquirer from 'inquirer';

// Utility function to introduce a delay (in seconds)
const sleep = (seconds) => new Promise(resolve => setTimeout(resolve, seconds * 1000));

// Utility functions for colored output
const colorize = (text, colorCode) => `\x1b[${colorCode}m${text}\x1b[0m`;
const purple = (text) => colorize(text, 35);
const blue = (text) => colorize(text, 34);
const green = (text) => colorize(text, 32);
const red = (text) => colorize(text, 31);

// Chain explorer URLs
const explorerMap = {
  1: 'https://etherscan.io/tx/',
  56: 'https://bscscan.com/tx/',
  137: 'https://polygonscan.com/tx/',
  42161: 'https://arbiscan.io/tx/',
  10: 'https://optimistic.etherscan.io/tx/',
  324: 'https://explorer.zksync.io/tx/',
  8453: 'https://basescan.org/tx/',
};

// ASCII art logo
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

// Validate and format private keys
const loadPrivateKeys = async (filePath) => {
  try {
    const keys = (await fs.readFile(filePath, 'utf-8'))
      .split('\n')
      .map((key) => key.trim())
      .filter((key) => key);

    return keys.map((key) => {
      if (/^0x[a-fA-F0-9]{64}$/.test(key)) {
        return key;
      } else if (/^[a-fA-F0-9]{64}$/.test(key)) {
        return `0x${key}`;
      } else {
        throw new Error(`Invalid private key format: ${key}`);
      }
    });
  } catch (error) {
    console.error(red(`Error loading private keys: ${error.message}`));
    process.exit(1);
  }
};

// Main process
const main = async () => {
  console.log(purple("=== Starting the process ==="));
  console.log(purple("Script created by:"));
  console.log(purple(createdByLogo));
  console.log(purple(creativeMessage));

  // Load private keys
  const privateKeys = await loadPrivateKeys('YourPrivateKey.txt');

  // Load network configurations
  let networks;
  try {
    networks = JSON.parse(await fs.readFile('listchainmainnet.txt', 'utf-8'));
  } catch (error) {
    console.error(red('Error reading network configurations.'));
    process.exit(1);
  }

  // Prompt user to choose a network
  const { networkChoice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'networkChoice',
      message: 'Pick the network you want to use:',
      choices: networks.map((net, index) => `${index + 1}. ${net.name}`),
    },
  ]);

  const networkIndex = parseInt(networkChoice.split('.')[0]) - 1;
  const { name, rpcUrl, chainId, symbol } = networks[networkIndex];

  console.log(purple(`\nConnecting to the ${name} network...`));
  const web3 = new Web3(rpcUrl);

  // Additional user inputs
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'amount',
      message: 'Enter the amount to send (in ETH or token unit):',
      validate: (input) => !isNaN(parseFloat(input)) && parseFloat(input) > 0,
    },
    {
      type: 'input',
      name: 'transactionsCount',
      message: 'Enter number of transactions per address:',
      validate: (input) => !isNaN(parseInt(input)) && parseInt(input) > 0,
    },
    {
      type: 'input',
      name: 'delay',
      message: 'How much delay (in seconds) between transactions?',
      validate: (input) => !isNaN(parseInt(input)) && parseInt(input) >= 0,
    },
    {
      type: 'confirm',
      name: 'useListAddresses',
      message: 'Do you want to send to multiple addresses from listaddress.txt?',
      default: true,
    },
    {
      type: 'input',
      name: 'singleAddress',
      message: 'Enter one address to send to (if not using list):',
      when: (answers) => !answers.useListAddresses,
      validate: (input) => /^0x[a-fA-F0-9]{40}$/.test(input) || 'Please enter a valid Ethereum address.',
    },
  ]);

  const { amount, transactionsCount, delay, useListAddresses, singleAddress } = answers;
  const targetAddresses = useListAddresses
    ? (await fs.readFile('listaddress.txt', 'utf-8'))
        .split('\n')
        .map((addr) => addr.trim())
        .filter((addr) => addr)
    : [singleAddress];

  console.log(`\nSelected Network: ${name}`);
  console.log(`Number of Addresses to Send To: ${targetAddresses.length}`);

  // TODO: Add transaction processing logic here with error handling
};

main().catch((error) => console.error(red(`An error occurred: ${error.message}`)));
