#!/usr/bin/env bash
# Deploy StellarFund contracts to Stellar MAINNET (Public).
# PREREQUISITE: the deploy account must be funded with real XLM.
#   Source key alias: stellarfund-mainnet
#   Address: GAQ5YHRV5POBZDJFP5EI5S6HOJCXVFY5LOQG76TI44D3DDEKCIANNURB
# Run once, after funding. Prints the addresses to put into Vercel env vars.
set -euo pipefail
export PATH="$HOME/.cargo/bin:$PATH"
NET=mainnet
SRC=stellarfund-mainnet
TOKEN=$(stellar contract id asset --asset native --network $NET)  # native XLM SAC

echo "Deploy account: $(stellar keys address $SRC)"
echo "Token (native XLM SAC): $TOKEN"

echo "Building contracts..."
( cd contracts/campaign && stellar contract build >/dev/null )
( cd contracts/reputation && stellar contract build >/dev/null )
( cd contracts/factory && stellar contract build >/dev/null )

echo "Uploading campaign wasm..."
CAMPAIGN_HASH=$(stellar contract upload --wasm contracts/campaign/target/wasm32v1-none/release/campaign.wasm --source $SRC --network $NET)

echo "Deploying reputation..."
sleep 4
REP_ID=$(stellar contract deploy --wasm contracts/reputation/target/wasm32v1-none/release/reputation.wasm --source $SRC --network $NET)

echo "Deploying factory..."
sleep 4
FACTORY_ID=$(stellar contract deploy --wasm contracts/factory/target/wasm32v1-none/release/factory.wasm --source $SRC --network $NET)

sleep 4
echo "Init factory..."
stellar contract invoke --id $FACTORY_ID --source $SRC --network $NET -- init --campaign_wasm_hash $CAMPAIGN_HASH --token $TOKEN --reputation $REP_ID >/dev/null

sleep 4
echo "Init reputation..."
stellar contract invoke --id $REP_ID --source $SRC --network $NET -- init --factory $FACTORY_ID >/dev/null

echo
echo "=== MAINNET DEPLOY COMPLETE — set these as Vercel env vars ==="
echo "NEXT_PUBLIC_CAMPAIGN_WASM_HASH=$CAMPAIGN_HASH"
echo "NEXT_PUBLIC_REPUTATION_ID=$REP_ID"
echo "NEXT_PUBLIC_FACTORY_ID=$FACTORY_ID"
echo "TOKEN (native XLM SAC, already in config)=$TOKEN"
