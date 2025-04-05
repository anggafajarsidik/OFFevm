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

# Typewriter animation
type_out() {
  text="$1"
  delay="${2:-0.005}"
  for ((i=0; i<${#text}; i++)); do
    echo -n "${text:$i:1}"
    sleep "$delay"
  done
  echo ""
}

# Opening banner
clear
type_out "Starting deployment process..." 0.03
sleep 0.5
type_out "Initializing scripts and reading configs..." 0.03
sleep 0.5
type_out "Launching the rocket to the blockchain..." 0.03
sleep 1
type_out "Script Created by :" 0.03
# Stylish ASCII logo + creative message
type_out "██████╗ ███████╗███████╗    ███████╗ █████╗ ███╗   ███╗██╗██╗  ██╗   ██╗" 0.002
type_out "██╔═══██╗██╔════╝██╔════╝    ██╔════╝██╔══██╗████╗ ████║██║██║  ╚██╗ ██╔╝" 0.002
type_out "██║   ██║█████╗  █████╗      █████╗  ███████║██╔████╔██║██║██║   ╚████╔╝" 0.002
type_out "██║   ██║██╔══╝  ██╔══╝      ██╔══╝  ██╔══██║██║╚██╔╝██║██║██║    ╚██╔╝" 0.002
type_out "╚██████╔╝██║     ██║         ██║     ██║  ██║██║ ╚═╝ ██║██║███████╗██║" 0.002
type_out " ╚═════╝ ╚═╝     ╚═╝         ╚═╝     ╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚══════╝╚═╝" 0.002
echo ""
type_out "╔══════════════════════════════════════════════════════╗" 0.002
type_out "║  ✨  Echoes of code ripple through the chain 🌐💥 ✨    ║" 0.002
type_out "╚══════════════════════════════════════════════════════╝" 0.002
echo ""

# ------------- FUNCTIONS -------------

generate_random_name() {
    adjectives=("Best" "Cool" "Mega" "Hyper" "Mystic" "Swift" "Quantum" "Turbo" "Neo" "Epic")
    nouns=("Token" "Tea" "Drop" "Node" "Storm" "Byte" "Spark" "Chain" "Core" "Dash")
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
        foundryup
    else
        echo -e "$SUCCESS Foundry already installed."
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
        if [ -f "$SCRIPT_DIR/listaddress.txt" ]; then
            mapfile -t CHECK_RECIPIENTS < "$SCRIPT_DIR/listaddress.txt"
            echo -e "$INFO Total recipient addresses found: ${#CHECK_RECIPIENTS[@]}"
        else
            echo -e "$ERROR listaddress.txt not found!"
            exit 1
        fi
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
        echo -e "$WAIT Waiting $DEPLOY_DELAY seconds..."
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
                --chain-id "$CHAIN_ID" \
                --verifier-url "$VERIFIER_URL" \
                --num-of-optimizations 200 \
                --watch \
                "$CONTRACT_ADDRESS" \
                src/CustomToken.sol:CustomToken \
                --constructor-args "" 2>&1)

            if echo "$OUTPUT" | grep -iq "Successfully verified"; then
                echo -e "$SUCCESS Verified: $EXPLORER_URL/address/$CONTRACT_ADDRESS"
                VERIFIED=true
            else
                echo -e "$WARN Retry #$((RETRY + 1)): Verification pending or failed."
                ((RETRY++))
                sleep 15
            fi
        done

        if [ "$VERIFIED" = false ]; then
            echo -e "$ERROR Failed to verify $CONTRACT_ADDRESS after $MAX attempts."
        fi
    done
}

send_tokens() {
    source "$SCRIPT_DIR/token_deployment/.env"
    if [ "$SEND_MODE" != true ]; then
        return
    fi

    echo -e "$INFO Preparing to send tokens..."

    for ((k = 0; k < ${#DEPLOYED_ADDRESSES[@]}; k++)); do
        TOKEN_ADDRESS=${DEPLOYED_ADDRESSES[$k]}
        PRIVATE_KEY=${DEPLOYER_WALLETS[$k]}
        WALLET_ADDRESS=$(cast wallet address --private-key "$PRIVATE_KEY" 2>/dev/null)

        echo -e "$DEPLOY Sending tokens from $WALLET_ADDRESS ($TOKEN_ADDRESS)"

        TOTAL_SUPPLY_HEX=$(cast call "$TOKEN_ADDRESS" "totalSupply()(uint256)")
        TOTAL_SUPPLY=$(cast --to-dec "$TOTAL_SUPPLY_HEX")
        DECIMALS_HEX=$(cast call "$TOKEN_ADDRESS" "decimals()(uint8)")
        DECIMALS=$(cast --to-dec "$DECIMALS_HEX")

        DISTRIBUTIONS=()
        NUM_RECIPIENTS=${#CHECK_RECIPIENTS[@]}
        REMAINING=$TOTAL_SUPPLY

        for ((i=0; i<$NUM_RECIPIENTS; i++)); do
            if [ $i -eq $((NUM_RECIPIENTS-1)) ]; then
                AMOUNT=$REMAINING
            else
                PERCENT=$((RANDOM % 5 + 1))
                AMOUNT=$((TOTAL_SUPPLY * PERCENT / 100))
                [ $AMOUNT -ge $REMAINING ] && AMOUNT=$((REMAINING / 2))
            fi
            REMAINING=$((REMAINING - AMOUNT))
            DISTRIBUTIONS+=($AMOUNT)
        done

        for ((i=0; i<$NUM_RECIPIENTS; i++)); do
            TO=${CHECK_RECIPIENTS[$i]}
            VALUE=${DISTRIBUTIONS[$i]}
            AMOUNT_WITH_DECIMALS=$(cast to-uint256 "$VALUE" | awk -v dec=$DECIMALS '{printf "%0.f", $1 * (10^dec)}')

            TX_HASH=$(cast send "$TOKEN_ADDRESS" "transfer(address,uint256)" "$TO" "$AMOUNT_WITH_DECIMALS" \
                --private-key "$PRIVATE_KEY" --rpc-url "$RPC_URL" 2>/dev/null)

            if [[ $TX_HASH == 0x* ]]; then
                echo -e "$SUCCESS Sent to $TO — $LINK $EXPLORER_URL/tx/$TX_HASH"
            else
                echo -e "$ERROR Failed to send to $TO"
            fi
        done
    done
}

# ------------- RUNNING FLOW -------------
install_dependencies
input_details
deploy_contracts
send_tokens
