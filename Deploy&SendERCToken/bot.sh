#!/bin/bash

# Aesthetic Colors & Emojis ✨
INFO="🔹"
WARN="⚠️"
ERROR="❌"
SUCCESS="✅"
WAIT="⏳"
DEPLOY="🚀"
VERIFY="🔍"
LINK="🔗"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit

# 🌐 Opening Logo
clear
echo -e "\n🌐 Echoes of code ripple through the chain 💥"
echo -e "----------------------------------------------"
echo -e "📦 Deploy ERC20 token with random/custom name & symbol"
echo -e "🚀 Supports multi-wallet deploy + contract verification"
echo -e "💸 Transfers will begin only after all successful deploy & contract verification"
echo -e "🔁 Transfer amount randomized between 0.5% and 5% of supply"
echo -e "----------------------------------------------"

# Random token name/symbol
generate_random_name() {
    adjectives=("Best" "Cool" "Mega" "Hyper" "Mystic" "Swift" "Quantum" "Turbo" "Neo" "Epic" "Lucky" "Ultra" "Shadow" "Crimson" "Funky" "Digital" "Silver" "Golden" "Atomic" "Cyber" "Nova" "Fierce" "Zeta" "Blazing" "Pixel" "Wild" "Bright" "Royal" "Frozen" "Inferno")
    nouns=("Token" "Tea" "Drop" "Node" "Gold" "Storm" "Byte" "Spark" "Chain" "Dust" "Core" "Dash" "Flame" "Wave" "Net" "Link" "Moon" "Gem" "Flux" "Orb" "Pulse" "Beam" "Bolt" "Edge" "X")
    adj=${adjectives[$RANDOM % ${#adjectives[@]}]}
    noun=${nouns[$RANDOM % ${#nouns[@]}]}
    echo "${adj}${noun}"
}

install_dependencies() {
    echo -e "$INFO Checking dependencies..."

    if ! command -v forge &> /dev/null; then
        echo -e "$WARN Foundry not found. Installing..."
        curl -L https://foundry.paradigm.xyz | bash
        source ~/.bashrc
        export PATH="$HOME/.foundry/bin:$PATH"
        echo 'export PATH="$HOME/.foundry/bin:$PATH"' >> ~/.bashrc
        source ~/.bashrc
        foundryup
    else
        echo -e "$SUCCESS Foundry is already installed."
    fi

    if [ ! -d "$SCRIPT_DIR/lib/openzeppelin-contracts" ]; then
        echo -e "$INFO Cloning OpenZeppelin contracts..."
        git clone https://github.com/OpenZeppelin/openzeppelin-contracts.git "$SCRIPT_DIR/lib/openzeppelin-contracts"
    else
        echo -e "$SUCCESS OpenZeppelin contracts already exist."
    fi
}

input_details() {
    echo -e "$INFO --------------------------"

    [ -f "$SCRIPT_DIR/token_deployment/.env" ] && rm "$SCRIPT_DIR/token_deployment/.env"

    read -p "Enter Token Name (leave blank for random): " TOKEN_NAME
    TOKEN_NAME=${TOKEN_NAME:-$(generate_random_name)}

    read -p "Enter Token Symbol (leave blank for random): " TOKEN_SYMBOL
    TOKEN_SYMBOL=${TOKEN_SYMBOL:-"${TOKEN_NAME:0:3}$((RANDOM % 100))"}

    read -p "Do you want to send tokens to addresses in listaddress.txt? (y/n): " SEND_TOKENS
    if [[ "$SEND_TOKENS" =~ ^[Yy]$ ]]; then
        SEND_MODE=true
        echo -e "$INFO Token transfers will be random between 0.5% and 5% of total supply 💸"
    else
        SEND_MODE=false
    fi

    echo -e "$INFO Reading private keys from YourPrivateKey.txt..."
    mapfile -t PRIVATE_KEYS < "$SCRIPT_DIR/YourPrivateKey.txt"

    NUM_CONTRACTS=${#PRIVATE_KEYS[@]}
    echo -e "$INFO Will deploy $NUM_CONTRACTS contracts (1 per wallet)."

    read -p "Delay between deploys in seconds (default: 10): " DEPLOY_DELAY
    DEPLOY_DELAY=${DEPLOY_DELAY:-10}

    read -p "Enter RPC URL (default: https://tea-sepolia.g.alchemy.com/public): " RPC_URL
    RPC_URL=${RPC_URL:-https://tea-sepolia.g.alchemy.com/public}

    EXPLORER_URL=https://sepolia.tea.xyz
    VERIFIER_URL="https://sepolia.tea.xyz/api/"
    CHAIN_ID=10218

    mkdir -p "$SCRIPT_DIR/token_deployment"
    cat <<EOL > "$SCRIPT_DIR/token_deployment/.env"
TOKEN_NAME="$TOKEN_NAME"
TOKEN_SYMBOL="$TOKEN_SYMBOL"
NUM_CONTRACTS="$NUM_CONTRACTS"
DEPLOY_DELAY="$DEPLOY_DELAY"
RPC_URL="$RPC_URL"
EXPLORER_URL="$EXPLORER_URL"
VERIFIER_URL="$VERIFIER_URL"
CHAIN_ID="$CHAIN_ID"
SEND_MODE="$SEND_MODE"
EOL

    cat <<EOL > "$SCRIPT_DIR/foundry.toml"
[profile.default]
src = "src"
out = "out"
libs = ["lib"]

[rpc_endpoints]
rpc_url = "$RPC_URL"
EOL

    echo -e "$SUCCESS Configuration saved!"
}

deploy_contracts() {
    source "$SCRIPT_DIR/token_deployment/.env"
    mkdir -p "$SCRIPT_DIR/src"

    TOTAL_SUPPLY=$(shuf -i 1000000-1000000000000 -n 1)

    cat <<EOL > "$SCRIPT_DIR/src/CustomToken.sol"
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
contract CustomToken is ERC20 {
    constructor() ERC20("$TOKEN_NAME", "$TOKEN_SYMBOL") {
        _mint(msg.sender, $TOTAL_SUPPLY * (10 ** decimals()));
    }
}
EOL

    echo -e "$INFO Compiling contract..."
    forge build || { echo -e "$ERROR Build failed."; exit 1; }

    DEPLOYED_ADDRESSES=()
    DEPLOYER_WALLETS=()

    for ((i = 0; i < NUM_CONTRACTS; i++)); do
        PRIVATE_KEY=${PRIVATE_KEYS[$i]}
        WALLET_ADDRESS=$(cast wallet address --private-key "$PRIVATE_KEY" 2>/dev/null)
        echo -e "$DEPLOY Deploying contract #$((i+1)) from wallet: $WALLET_ADDRESS"

        DEPLOY_OUTPUT=$(forge create "$SCRIPT_DIR/src/CustomToken.sol:CustomToken" \
            --rpc-url "$RPC_URL" \
            --private-key "$PRIVATE_KEY" \
            --broadcast 2>&1)

        CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -oP 'Deployed to: \K(0x[a-fA-F0-9]{40})')
        if [ -z "$CONTRACT_ADDRESS" ]; then
            echo -e "$ERROR Failed to extract contract address."
            echo "$DEPLOY_OUTPUT"
            continue
        fi

        DEPLOYED_ADDRESSES+=("$CONTRACT_ADDRESS")
        DEPLOYER_WALLETS+=("$PRIVATE_KEY")

        echo -e "$SUCCESS Deployed at: $CONTRACT_ADDRESS"
        echo -e "$LINK $EXPLORER_URL/address/$CONTRACT_ADDRESS"

        echo -e "$WAIT Waiting $DEPLOY_DELAY seconds before next deploy..."
        sleep "$DEPLOY_DELAY"
    done

    echo -e "\n$VERIFY Starting contract verification..."

    for ((j = 0; j < ${#DEPLOYED_ADDRESSES[@]}; j++)); do
        CONTRACT_ADDRESS=${DEPLOYED_ADDRESSES[$j]}
        echo -e "\n$VERIFY Verifying $CONTRACT_ADDRESS..."

        RETRY=0
        MAX=5
        VERIFIED=false

        while [ "$VERIFIED" = false ] && [ $RETRY -lt $MAX ]; do
            OUTPUT=$(forge verify-contract \
                --rpc-url "$RPC_URL" \
                --verifier blockscout \
                --verifier-url "$VERIFIER_URL" \
                "$CONTRACT_ADDRESS" \
                "$SCRIPT_DIR/src/CustomToken.sol:CustomToken" 2>&1)

            if echo "$OUTPUT" | grep -qi "already verified"; then
                echo -e "$SUCCESS Already verified!"
                VERIFIED=true
            elif echo "$OUTPUT" | grep -qi "Verification successful"; then
                echo -e "$SUCCESS Verified successfully!"
                VERIFIED=true
            else
                RETRY=$((RETRY + 1))
                echo -e "$WARN Attempt $RETRY failed. Retrying in $DEPLOY_DELAY secs..."
                sleep "$DEPLOY_DELAY"
            fi
        done

        if [ "$VERIFIED" = false ]; then
            echo -e "$ERROR Skipping verification for $CONTRACT_ADDRESS after $MAX attempts."
        fi
    done

    if [ "$SEND_MODE" = true ]; then
        if [ ! -f "$SCRIPT_DIR/listaddress.txt" ]; then
            echo -e "$ERROR listaddress.txt not found. Skipping transfers."
            return
        fi

        mapfile -t RECIPIENTS < "$SCRIPT_DIR/listaddress.txt"
        for ((i = 0; i < ${#DEPLOYED_ADDRESSES[@]}; i++)); do
            TOKEN_ADDRESS=${DEPLOYED_ADDRESSES[$i]}
            DEPLOYER_KEY=${DEPLOYER_WALLETS[$i]}
            DEPLOYER_ADDRESS=$(cast wallet address --private-key "$DEPLOYER_KEY" 2>/dev/null)
            echo -e "$INFO Sending tokens from wallet: $DEPLOYER_ADDRESS"

            for RECIPIENT in "${RECIPIENTS[@]}"; do
                CODE_AT_ADDR=$(cast code "$RECIPIENT" --rpc-url "$RPC_URL")
                if [[ "$CODE_AT_ADDR" != "0x" ]]; then
                    echo -e "$WARN Skipping $RECIPIENT (smart contract)"
                    continue
                fi

                PERCENT=$(shuf -i 5-50 -n 1)
                AMOUNT=$(echo "scale=4; $TOTAL_SUPPLY * $PERCENT / 1000" | bc)
                AMOUNT_WEI=$(cast to-wei $AMOUNT ether)

                TX_OUTPUT=$(cast send "$TOKEN_ADDRESS" "transfer(address,uint256)" "$RECIPIENT" "$AMOUNT_WEI" \
                    --private-key "$DEPLOYER_KEY" --rpc-url "$RPC_URL" --legacy 2>/dev/null)

                TX_HASH=$(echo "$TX_OUTPUT" | grep -oP 'Transaction hash: \K(0x[a-fA-F0-9]+)')
                TX_LINK="$EXPLORER_URL/tx/$TX_HASH"

                printf "💸 Sent %-12s tokens (%2d%%) ➡️ %-42s ✅ 🔗 %s\n" \
                    "$AMOUNT" "$((PERCENT / 10))" "$RECIPIENT" "$TX_LINK"
                sleep 2
            done
        done
    fi
}

# 🔄 Run All
install_dependencies
input_details
deploy_contracts
