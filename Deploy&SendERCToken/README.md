
# ERC20 Token Deployment and Distribution Script

This script automates the process of deploying an ERC20 token on the blockchain and distributing it to multiple recipients. It includes multi-wallet support, contract verification, and random or custom token name and symbol generation. Additionally, the script allows for token distribution to addresses listed in a `listaddress.txt` file.

## Features

- Deploy an ERC20 token with a random or custom name and symbol.
- Support for multiple wallet deployments.
- Automatic contract verification.
- Send ERC20 tokens to multiple addresses from `listaddress.txt`.
- Distribution of tokens is done randomly, ensuring no wallet is left out.
- Stylish, emoji-enhanced output with typewriter animation.

## Prerequisites

- Foundry (Forge and Cast)
- OpenZeppelin Contracts
- Node.js (for any dependencies)
- Private Keys stored in `YourPrivateKey.txt`
- A list of recipient addresses in `listaddress.txt`

## How to Use

1. **Clone the repository** or download the script.
2. **Install dependencies**:
   - The script will automatically check if Foundry is installed and install it if necessary.
   - OpenZeppelin contracts will be cloned if not already present.
3. **Configure the script**:
   - Provide the RPC URL (default is for Tea Sepolia).
   - Set a delay between deploys (default is 10 seconds).
   - Specify the token name and symbol or leave blank for random generation.
   - Provide the path to `YourPrivateKey.txt` and `listaddress.txt`.
4. **Run the script**:
   - The script will deploy the ERC20 token(s), verify the contract, and optionally send tokens to the addresses in `listaddress.txt`.
5. **Monitor the process**:
   - The script will display transaction details and links to the block explorer.

## File Descriptions

- `deployontea.sh`: The main script for deployment and token distribution.
- `listaddress.txt`: A text file containing the addresses of recipients to receive the tokens.
- `YourPrivateKey.txt`: A text file containing the private keys of the wallets to be used for deployment.
- `foundry.toml`: Configuration file for Foundry RPC endpoints.
- `.env`: Stores environment variables like token name, symbol, and RPC URL.

## Example Usage

```bash
bash deployontea.sh
```

### Token Name and Symbol

- The token name and symbol can either be provided by the user or generated randomly.
- Example: A random token name could be `EpicChain`, and the symbol could be `EPC`.

### Delay Between Deployments

- The default delay between deployments is set to 10 seconds. You can change this as needed.

### Sending Tokens

- If you choose to send tokens, the script will distribute tokens to the recipients listed in `listaddress.txt`.
- The total token amount will be split randomly among the recipients.

## License

This script is open-source and free to use. Please give credit if using or modifying for your own purposes.

