Tutorial to Run the Script


---

1. Install Required Tools

Node.js: Install it from Node.js Official Website.

Text Editor: Use any editor like VS Code or Notepad++.



---

2. Set Up the Script

1. Git Clone & open the folder:

gitclone https://github.com/anggafajarsidik/OFFautotxevm
cd offscript

2.Add Configuration Files

YourPrivateKey.txt: Add your private keys (one per line).
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

3. Run the Script

1. Open your terminal.


2. Navigate to the folder:

cd offscript


3. Run the script:

node autotxtestnet.js




---

5. Follow the Prompts

Select the network.

Enter the amount, number of transactions, and delay.

Choose to send to multiple or single addresses.


The script will handle the rest!
