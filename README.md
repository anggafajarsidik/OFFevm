## **Features**
- Sends transactions to multiple addresses from a list or a single address.
- Supports custom delay between transactions.
- Easy configuration for different networks.
- Supports multiple wallets.
- Automatically retries failed transactions due to RPC errors, gas issues, or timeouts.
- Fetches gas price dynamically and ensures correct nonce.
- Skips sending to smart contract addresses.
- Logs transaction status and errors in real time.
-Never stops trying, always resumes from where it failed.
---

## **Requirements**
1. [Node.js](https://nodejs.org/) (v14+ recommended).
2. NPM packages: `web3`, `inquirer`, and `fs/promises`.

---

## **Setup Instructions**

### **1. Clone the Repository**
```bash
git clone https://github.com/anggafajarsidik/OFFevm
cd OFFevm
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Configure Required Files**
Create the following files in the project directory:  

- **`YourPrivateKey.txt`**: Add private keys (one per line).  
  Example:  
  ```
  0x123abc456...
  0x789xyz101...
  ```

- **`listchaintestnet.txt & listchainmainnet.txt`**: Add network details in JSON format.  
  Example:  
  ```json
  [
    {"name": "Ethereum", "rpcUrl": "https://mainnet.infura.io/v3/YOUR_INFURA_KEY", "chainId": 1, "symbol": "ETH"},
    {"name": "Binance Smart Chain", "rpcUrl": "https://bsc-dataseed.binance.org/", "chainId": 56, "symbol": "BNB"}
  ]
  ```

- **`listaddress.txt`**: Add recipient addresses (one per line).  
  Example:  
  ```
  0xabc123...
  0xdef456...
  ```

---

## **Run the Script**
1. For Testnet
```bash
   node autotxtestnet.js
   ```
2. For Mainnet
```bash
   node autotxmainnet.js
   ```
---
## **If you got error or stuck
1. Execute this command :
```bash
   npm audit fix --force
   ```

## **How It Works**
1. Follow the interactive prompts:
   - Select a blockchain network.
   - Input the amount to send, number of transactions, and delay.
   - Choose to send to multiple addresses or a single address.
2. The script processes transactions and displays colored output for transaction status.

---

## **Disclaimer**
This script is provided "as-is" for educational purposes only. The author and contributors are not responsible for any damages, losses, or legal issues arising from the use of this script. Users must ensure compliance with local laws and regulations regarding cryptocurrency transactions and blockchain technology.

Use at your own risk.
