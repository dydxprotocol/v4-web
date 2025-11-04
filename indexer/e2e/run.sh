#!/bin/bash

echo "Starting the fuel node"
FUEL_NODE_OUT=`(pnpm --filter starboard/contracts run:node 2>&1 &) | grep -m 1 "Node is up" | wc -l`
if [ "$FUEL_NODE_OUT" -ne "1" ]; then
    echo "fuel node failed to start"
    exit 1
fi

FUEL_NODE_PID=`pgrep -A "fuel-core"`
if [ -z "$FUEL_NODE_PID" ]; then
    echo "fuel node process is down"
    exit 1
fi

echo "Deploying Mocked Stork contract"
OUTPUT=`pnpm --filter starboard/contracts deploy:stork-mock --url="http://127.0.0.1:4000/v1/graphql" --privK="0x9e42fa83bda35cbc769c4b058c721adef68011d7945d0b30165397ec6d05a53a"`
echo "$OUTPUT"
MOCK_STORK_CONTRACT=`echo "$OUTPUT" | grep "Mocked Stork deployed to" |  awk '{print $NF}'`
if [ -z "$MOCK_STORK_CONTRACT" ]; then
    echo "stork mock deployemnt failed"
    echo "$OUTPUT"
    kill $FUEL_NODE_PID
    exit 1
fi

echo "Deploying the Vault contract"
OUTPUT=`pnpm --filter starboard/contracts setup:testnet --url="http://127.0.0.1:4000/v1/graphql" --privK="0x9e42fa83bda35cbc769c4b058c721adef68011d7945d0b30165397ec6d05a53a" --storkContractAddress="${MOCK_STORK_CONTRACT}"`
echo "$OUTPUT"
USDC_CONTRACT=`echo "$OUTPUT" | grep -A 2 "Deploying token named mckUSDC sUSDC" | grep "Token deployed to" |  awk '{print $(NF-2)}'`
USDC_ASSET_ID=`echo "$OUTPUT" | grep -A 2 "Deploying token named mckUSDC sUSDC" | grep "Token deployed to" |  awk '{print $NF}'`
VAULT_CONTRACT=`echo "$OUTPUT" | grep "Vault deployed to" |  awk '{print $NF}'`
if [ -z "$USDC_CONTRACT" ] || [ -z "$USDC_ASSET_ID" ] || [ -z "$VAULT_CONTRACT" ]; then
    echo "vault deployemnt failed"
    echo "$OUTPUT"
    kill $FUEL_NODE_PID
    exit 1
fi


echo "Launch Postgres database to store the data"
docker compose up -d
if [ $? -ne 0 ]; then
    echo "Failed to launch Postgres database"
    kill $FUEL_NODE_PID
    exit 1
fi

EXIT_CODE=0

echo "Apply database migrations to create the target schema"
# there is some delay on OS to expose a port
sleep 1
pnpm apply:migration
if [ $? -ne 0 ]; then
    echo "Failed to apply database migrations"
    EXIT_CODE=1
else
    echo "Starting the squid indexer"
    # weird but it works this way, there were problems with redirecting logs
    VAULT_PRICEFEED_ADDRESS=${MOCK_STORK_CONTRACT} VAULT_ADDRESS=${VAULT_CONTRACT} pnpm start:ci 2>&1 | tee indexer.log > /dev/null &
    SQD_INDEXER_PID=$!
    SQD_INDEXER_OUT=`tail -f -n +1 indexer.log | grep -m 1 "Indexer run started" | wc -l`
    echo SQD_INDEXER_OUT $SQD_INDEXER_OUT $SQD_INDEXER_PID
    if [ "$SQD_INDEXER_OUT" -ne "1" ]; then
        echo "squid indexer failed to start"
        cat indexer.log
        EXIT_CODE=1
    fi
    if [ -z "$SQD_INDEXER_PID" ]; then
        echo "squid indexer process is down"
        cat indexer.log
        EXIT_CODE=1
    fi
    
    echo "APPLIED"
fi


echo "clean up the squid indexer"
kill $SQD_INDEXER_PID
if [ $? -ne 0 ]; then
    echo "Failed to down the squid indexer"
    EXIT_CODE=1
fi

echo "Shut down Postgres and erase the indexer data"
docker compose down -v
if [ $? -ne 0 ]; then
    echo "Failed to erase the indexer data"
    EXIT_CODE=1
fi

echo "clean up the fuel node"
kill $FUEL_NODE_PID
if [ $? -ne 0 ]; then
    echo "Failed to down the fuel node"
    EXIT_CODE=1
fi

exit $EXIT_CODE
