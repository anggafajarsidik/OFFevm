#!/bin/bash

# Emoji Style Markers
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

# Typewriter Effect
type_out() {
  text="$1"
  delay="${2:-0.005}"
  for ((i=0; i<${#text}; i++)); do
    echo -n "${text:$i:1}"
    sleep "$delay"
  done
  echo ""
}

# Opening
clear
type_out "Starting deployment process..." 0.0003
sleep 0.1
type_out "Initializing scripts and reading configs..." 0.0003
sleep 0.1
type_out "Launching the rocket to the blockchain..." 0.0003
sleep 0.5
type_out "Script Created by :" 0.03
type_out "██████╗ ███████╗███████╗    ███████╗ █████╗ ███╗   ███╗██╗██╗  ██╗   ██╗" 0.000001
type_out "██╔═══██╗██╔════╝██╔════╝    ██╔════╝██╔══██╗████╗ ████║██║██║  ╚██╗ ██╔╝" 0.000001
type_out "██║   ██║█████╗  █████╗      █████╗  ███████║██╔████╔██║██║██║   ╚████╔╝" 0.000001
type_out "██║   ██║██╔══╝  ██╔══╝      ██╔══╝  ██╔══██║██║╚██╔╝██║██║██║    ╚██╔╝" 0.000001
type_out "╚██████╔╝██║     ██║         ██║     ██║  ██║██║ ╚═╝ ██║██║███████╗██║" 0.000001
type_out " ╚═════╝ ╚═╝     ╚═╝         ╚═╝     ╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚══════╝╚═╝" 0.000001
echo ""
type_out "╔══════════════════════════════════════════════════════╗" 0.000001
type_out "║  ✨   Echoes of code ripple through the chain 🌐💥 ✨     ║" 0.000001
type_out "╚══════════════════════════════════════════════════════╝" 0.000001
echo ""

# Token Name Generator
generate_random_name() {
  adjectives=(
    "Tea" "Teafy" "Steamy" "Hot" "Icy" "Chill" "Bold" "Mystic" "Royal" "Zen"
    "Ancient" "Fresh" "Golden" "Green" "Black" "White" "Oolong" "Crisp" "Magic" "Turbo"
    "Quantum" "Meta" "Cyber" "Neo" "Ultra" "Secret" "Smooth" "Creamy" "Brewed" "Smoky"
    "Wild" "Earthy" "Flowing" "Dripped" "Infused" "Sipped" "Lush" "Dreamy" "Divine" "Elixir"
    "Herbal" "Silky" "Cloudy" "Gentle" "Rare" "Epic" "Sweet" "Savage" "Glacial" "Power"
    "Celestial" "Luminous" "Alpine" "Crystal" "Eternal" "Tasty" "Misty" "Velvet" "Cocoa"
    "Brewster" "Steeper" "Swirl" "Blissful" "Serene" "Frosted" "Charmed" "Steeped" "Soothing"
    "Soothe" "Breezy" "Mellow" "Flowery" "Vibrant" "Fire" "Vivid" "Noble" "Breezy"
    "Ancient" "Bitter" "Refreshing" "Sublime" "Delightful" "Fragrant" "Classic" "Fluffy"
    "Frisky" "Heavenly" "Sunny" "Wholesome" "Aromatic" "Thirsty" "Rich" "Boldly" "Charming"
    "Zesty" "Tart" "Wildly" "Smoothly" "Bitterly" "Spicy" "Tasty" "Crisp" "Bitter"
    "Exotic" "Zingy" "Gourmet" "Delicious" "Sippable" "Luxurious" "Plush" "Fizzy" "Freshly"
    "Intense" "Savory" "Vibrantly" "Tingling" "Lushly" "Infused" "Herbalicious" "Fragrant"
    "Bitter" "Lively" "Sour" "Sparkling" "Buzzy" "Flavorful" "Lively" "Wildish" "Hazy"
    "Whispering" "Lightly" "Crisply" "Deeply" "Calming" "Pure" "Untamed"
  )

  nouns=(
    "Tea" "Token" "Drop" "Brew" "Cup" "Pot" "Leaf" "Leaves" "Stream" "Chain"
    "Node" "Spirit" "Storm" "Wave" "Time" "Flow" "Bliss" "Leaflet" "Dust" "Shot"
    "Dash" "Blend" "Tonic" "Infusion" "Splash" "Sprout" "Root" "Elixir" "Brewer" "Bag"
    "Whirl" "Aura" "Chalice" "Flame" "Spark" "Steam" "Frost" "Bloom" "Essence" "Origin"
    "Whisp" "Whirlwind" "Burst" "Pulse" "Crush" "Crave" "Zone" "Realm" "Vortex" "Flavor"
    "Brewmaster" "Whisk" "Sprinkle" "Eruption" "Kettle" "Frosting" "Blooming" "Rush" "Vibe"
    "Citrus" "Essence" "Myst" "Brewer" "Potpourri" "Breeze" "Vapour" "Eclipse" "Leafage"
    "Harvest" "Blend" "Nectar" "Journey" "Charm" "Perk" "Tide" "Brewtastic" "Gusto"
    "Dew" "Spritz" "Sipper" "Swirl" "Fruity" "Mix" "Classic" "Mystify" "Wave" "Tearise"
    "Chase" "Flick" "Bubbly" "Pour" "Refreshment" "Twirl" "Glam" "Whiz" "Zing" "Sage"
    "Swarm" "Brewer" "Storm" "Spice" "Taste" "Harmonic" "Soul" "Mist" "Reef" "Chime"
    "Echo" "Essence" "Night" "Fusion" "Fusionize" "Sip" "Kettle" "Brewtiful" "Swell"
    "Touch" "Savory" "Teaser" "Zest" "Splash" "Snap" "Brewgen" "Chime" "Sipify" "Cupful"
    "Infused" "Brewfinity" "Brewit" "Teacraft" "Flavorize" "Clarity" "Liquid" "Harmonic"
    "Potion" "Vibe" "Glow" "Twist" "Chillax" "Zenith" "Vibe"
  )

  echo "${adjectives[RANDOM % ${#adjectives[@]}]}${nouns[RANDOM % ${#nouns[@]}]}"
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
    constructor() ERC20(unicode"$TOKEN_NAME", unicode"$TOKEN_SYMBOL") {
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

        # Get the latest nonce for the wallet
        NONCE=$(cast nonce "$WALLET_ADDRESS" --rpc-url "$RPC_URL")

        DEPLOY_OUTPUT=$(forge create "$SCRIPT_DIR/src/CustomToken.sol:CustomToken" \
            --rpc-url "$RPC_URL" \
            --private-key "$PRIVATE_KEY" \
            --gas-price 50gwei \
            --priority-gas-price 25gwei \
            --gas-limit 3000000 \
            --nonce $NONCE \
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
        mapfile -t RECIPIENTS < "$SCRIPT_DIR/listaddress.txt"
        for ((i = 0; i < ${#DEPLOYED_ADDRESSES[@]}; i++)); do
            TOKEN_ADDRESS=${DEPLOYED_ADDRESSES[$i]}
            DEPLOYER_KEY=${DEPLOYER_WALLETS[$i]}
            DEPLOYER_ADDR=$(cast wallet address --private-key "$DEPLOYER_KEY")

            echo -e "$INFO Sending tokens from contract $TOKEN_ADDRESS by wallet $DEPLOYER_ADDR"

            REMAINING_SUPPLY=$(echo "$TOTAL_SUPPLY * 90 / 100" | bc)
            TOTAL_RECIPIENTS=${#RECIPIENTS[@]}

            for ((j = 0; j < TOTAL_RECIPIENTS; j++)); do
                RECIPIENT=$(echo "${RECIPIENTS[$j]}" | tr -d '[:space:]')

                if [[ ! "$RECIPIENT" =~ ^0x[a-fA-F0-9]{40}$ ]]; then
                    echo -e "$WARN Skipping invalid address format: $RECIPIENT"
                    continue
                fi

                CODE_AT_ADDR=$(cast code "$RECIPIENT" --rpc-url "$RPC_URL")
                if [[ "$CODE_AT_ADDR" != "0x" ]]; then
                    echo -e "$WARN Skipping $RECIPIENT (smart contract)"
                    continue
                fi

                if (( j == TOTAL_RECIPIENTS - 1 )); then
                    AMOUNT=$REMAINING_SUPPLY
                else
                    AVG=$(echo "$REMAINING_SUPPLY / ($TOTAL_RECIPIENTS - j)" | bc)
                    MIN=$(echo "$AVG / 2" | bc)
                    MAX=$(echo "$AVG * 2" | bc)
                    AMOUNT=$(shuf -i "$MIN"-"$MAX" -n 1)
                fi

                REMAINING_SUPPLY=$((REMAINING_SUPPLY - AMOUNT))
                AMOUNT_WEI=$(cast to-wei "$AMOUNT" ether)

                TX_OUTPUT=$(cast send "$TOKEN_ADDRESS" "transfer(address,uint256)" "$RECIPIENT" "$AMOUNT_WEI" \
                    --private-key "$DEPLOYER_KEY" --rpc-url "$RPC_URL" --legacy 2>/dev/null)

                TX_HASH=$(echo "$TX_OUTPUT" | grep -oP 'Transaction hash: \K(0x[a-fA-F0-9]+)')
                TX_LINK="$EXPLORER_URL/tx/$TX_HASH"

                printf "💸 Sent %-12s tokens ➡️ %-42s ✅ 🔗 %s\n" \
                    "$AMOUNT" "$RECIPIENT" "$TX_LINK"
                sleep 2
            done
        done
        echo -e ""
        echo -e "$SUCCESS 🎉 All tokens have been successfully distributed to all addresses listed in listaddress.txt!"
        echo -e "$INFO 📬 Distribution complete. You're all set!"
        echo -e "$INFO 🔚 Exiting script. Thank you for using this tool!"
    fi
}

# ========== Execution ==========

install_dependencies
input_details
deploy_contracts
