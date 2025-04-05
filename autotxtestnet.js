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

const main = async () => {
  console.clear();
  await typeOut(purple("=== Starting the process ===\n"), 10);
  await typeOut(purple("Script created by:\n\n"), 10);
  for (let line of logoLines) await typeOut(purple(line + "\n"), 1);
  await typeOut(purple(creativeMessage), 5);

  const privateKeys = (await fs.readFile("YourPrivateKey.txt", "utf-8")).split("\n").map(key => key.trim()).filter(key => key);
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
  const { amount, transactionsCount, delay: txDelay, retryDelay, useListAddresses } = answers;

  const targetAddresses = useListAddresses
    ? (await fs.readFile("listaddress.txt", "utf-8")).split("\n").map(addr => addr.trim()).filter(addr => addr)
    : [];

  console.log(`\nYou have selected the network: ${cyan(name)}.`);
  console.log(`Total wallets to use: ${privateKeys.length}`);
  console.log(`Total target addresses: ${targetAddresses.length || "Each wallet will send to itself"}`);

  const privateKeysWithPrefix = privateKeys.map(key => key.startsWith("0x") ? key : `0x${key}`);

  for (let walletIndex = 0; walletIndex < privateKeysWithPrefix.length; walletIndex++) {
    const privateKey = privateKeysWithPrefix[walletIndex];
    const web3 = new Web3(rpcUrl);
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);

    console.log(`\n🔄 Switching to Wallet ${walletIndex + 1} of ${privateKeysWithPrefix.length}: ${green(account.address)}`);

    for (let i = 0; i < (targetAddresses.length || 1); i++) {
      const toAddress = targetAddresses[i] || account.address;

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
        console.log(`\n🚀 Sending transaction #${txIndex + 1} from ${green(account.address)} to ${cyan(toAddress)}...`);
        let success = false;

        while (!success) {
          try {
            const gasPrice = BigInt(await web3.eth.getGasPrice()) * 2n;
            const amountInWei = BigInt(web3.utils.toWei(amount, "ether"));
            const gasLimit = BigInt(21000);
            const nonce = await web3.eth.getTransactionCount(account.address, "latest");

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

            console.log(`✅ Transaction successful: ${blue(`${explorer}/tx/${receipt.transactionHash}`)}`);
            success = true;

            if (txDelay > 0) {
              console.log(`⏳ Waiting for ${txDelay} seconds before next transaction...`);
              await sleep(txDelay);
            }
          } catch (error) {
            console.error(`❌ Transaction failed from ${green(account.address)} to ${cyan(toAddress)}, retrying in ${retryDelay} seconds...`, error.message);
            await sleep(retryDelay);
          }
        }
      }
    }
  }

  console.log(purple("🎉 === All transactions completed ==="));
};

main().catch(async (error) => {
  console.error("Unexpected error occurred. Retrying main loop...", error.message);
  await sleep(5);
  main();
});
