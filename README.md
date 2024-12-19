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

Run the script:

node autotxtestnet.js
