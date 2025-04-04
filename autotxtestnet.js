import Web3 from 'web3';
import fs from 'fs/promises';
import inquirer from 'inquirer';

const sleep = (seconds) => new Promise(resolve => setTimeout(resolve, seconds * 1000));
const purple = (text) => `\x1b[35m${text}\x1b[0m`;
const blue = (text) => `\x1b[34m${text}\x1b[0m`;
const green = (text) => `\x1b[32m${text}\x1b[0m`;
const cyan = (text) => `\x1b[36m${text}\x1b[0m`;

const createdByLogo = `
${purple(`
 ██████╗ ███████╗███████╗    ███████╗ █████╗ ███╗   ███╗██╗██╗  ██╗   ██╗
██╔═══██╗██╔════╝██╔════╝    ██╔════╝██╔══██╗████╗ ████║██║██║  ╚██╗ ██╔╝
██║   ██║█████╗  █████╗      █████╗  ███████║██╔████╔██║██║██║   ╚████╔╝ 
██║   ██║██╔══╝  ██╔══╝      ██╔══╝  ██╔══██║██║╚██╔╝██║██║██║    ╚██╔╝  
╚██████╔╝██║     ██║         ██║     ██║  ██║██║ ╚═╝ ██║██║███████╗██║   
 ╚═════╝ ╚═╝     ╚═╝         ╚═╝     ╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚══════╝╚═╝   
`)}`;

const main = async () => {
  console.clear();
  console.log(purple("=== Starting the process ==="));
  console.log(purple("Script created by:"));
  console.log(createdByLogo);

  const privateKeys = (await fs.readFile("YourPrivateKey.txt", "utf-8"))
    .split("\n").map(key => key.trim()).filter(key => key);
  const networks = JSON.parse(await fs.readFile("listchaintestnet.txt", "utf-8"));

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

  const networkChoiceIndex = parseInt(answers.networkChoice.split(".")[0]) - 1;
  const { name, rpcUrl, chainId, explorer } = networks[networkChoiceIndex];
  const { amount, transactionsCount, delay, retryDelay, useListAddresses } = answers;

  const targetAddresses = useListAddresses
    ? (await fs.readFile("listaddress.txt", "utf-8")).split("\n").map(addr => addr.trim()).filter(addr => addr)
    : [];

  console.log(`\nYou have selected the network: ${cyan(name)}.`);
  
  const privateKeysWithPrefix = privateKeys.map(key => key.startsWith("0x") ? key : `0x${key}`);
  console.log(`Using ${privateKeysWithPrefix.length} wallet(s) for transactions.`);

  for (const privateKey of privateKeysWithPrefix) {
    const web3 = new Web3(rpcUrl);
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    let nonce = await web3.eth.getTransactionCount(account.address, "pending");
    console.log(`\nStarting transactions for Wallet: ${green(account.address)}`);
    
    for (let i = 0; i < transactionsCount; i++) {
      console.log(`\nSending transaction #${i + 1} from ${green(account.address)}...`);
      let success = false;
      
      while (!success) {
        try {
          const gasPrice = BigInt(await web3.eth.getGasPrice()) * 2n;
          const amountInWei = BigInt(web3.utils.toWei(amount, "ether"));
          const gasLimit = BigInt(21000);
          
          const toAddress = useListAddresses ? targetAddresses[i % targetAddresses.length] : account.address;
          console.log(`Transaction target: ${green(toAddress)}`);

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
          
          console.log(`Transaction successful: ${blue(`${explorer}/tx/${receipt.transactionHash}`)}`);
          success = true;
          nonce++;
          
          if (delay > 0) {
            console.log(`Waiting for ${delay} seconds before next transaction...`);
            await sleep(delay);
          }
        } catch (error) {
          console.error(`Transaction failed from ${green(account.address)}, retrying in ${retryDelay} seconds...`, error.message);
          await sleep(retryDelay);
        }
      }
    }
  }
  console.log(purple("=== All transactions completed ==="));
};

main().catch(error => {
  console.error("An error occurred:", error.message);
});
