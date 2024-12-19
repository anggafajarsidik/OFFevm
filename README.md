README.md

# OFF Project - Automated Blockchain Transaction Script  

An efficient Node.js script for sending multiple transactions on blockchain networks.  

---

## **Features**
- Send transactions to multiple addresses from a list.
- Supports custom delay between transactions.
- Easy configuration for different networks.
- Displays transaction status with colored output.  

---

## **Requirements**
1. [Node.js](https://nodejs.org/) (v14+ recommended).
2. NPM packages: `web3`, `inquirer`, and `fs/promises`.

---

## **Setup Instructions**

### **1. Clone the Repository**
```bash
git clone <repository_url>
cd <repository_name>

2. Install Dependencies

npm install

3. Configure Required Files

Create the following files in the project directory:

YourPrivateKey.txt: Add private keys (one per line).
Example:

0x123abc456...
0x789xyz101...

listchaintestnet.txt: Add network details in JSON format.
Example:

[
  {"name": "Ethereum", "rpcUrl": "https://mainnet.infura.io/v3/YOUR_INFURA_KEY", "chainId": 1, "symbol": "ETH"},
  {"name": "Binance Smart Chain", "rpcUrl": "https://bsc-dataseed.binance.org/", "chainId": 56, "symbol": "BNB"}
]

listaddress.txt: Add recipient addresses (one per line).
Example:

0xabc123...
0xdef456...



---

Run the Script

1. Open a terminal and navigate to the project folder:

cd <repository_name>


2. Execute the script:

node autotxtestnet.js




---

How It Works

1. Follow the interactive prompts:

Select a blockchain network.

Input the amount to send, number of transactions, and delay.

Choose to send to multiple addresses or a single address.



2. The script processes transactions and displays colored output for transaction status.




---

License

This project is licensed under the MIT License.




