#!/bin/bash

kill_with_children () {
    local pid=$1
    for spid in $(ps -o pid= --ppid $pid); do
        kill_with_children $spid
    done
    kill -15 $pid
}

if [ $# -lt 2 ]; then
    echo "Usage: ./e2e/run.sh <populate-events-script> <verify-indexer-script> <optional i>"
    echo "i - interactive mode, waits for CTRL-C before shutting down"
    echo "scripts can be 'none'"
    exit 1
fi

INTERACTIVE=0
ii=2
for arg in "$@"
do
    if [ $ii -gt 1 ]; then
        if [ $arg = "i" ]; then
            INTERACTIVE=1
        fi
    fi
    ii=$(($ii+1))
done

# echo "Launch Postgres database and Fuel Node"
# pnpm sqd up:local
# if [ $? -ne 0 ]; then
#     echo "Failed to launch Postgres database and Fuel Node"
#     # just in case, clean up running containers
#     docker compose down -v
#     exit 1
# fi

echo "Deploying Mocked Stork contract"
# priv key is hardcoded, taken form the fuel node starting script
OUTPUT=`pnpm --filter starboard/contracts deploy:stork-mock --url="http://127.0.0.1:4000/v1/graphql" --privK="0x9e42fa83bda35cbc769c4b058c721adef68011d7945d0b30165397ec6d05a53a"`
echo "$OUTPUT"
MOCK_STORK_CONTRACT=`echo "$OUTPUT" | grep "Mocked Stork deployed to" |  awk '{print $NF}'`
if [ -z "$MOCK_STORK_CONTRACT" ]; then
    echo "stork mock deployment failed"
    echo "$OUTPUT"
    docker compose down -v
    exit 1
fi

echo "Deploying the Vault contract"
OUTPUT=`pnpm --filter starboard/contracts setup:testnet --url="http://127.0.0.1:4000/v1/graphql" --privK="0x9e42fa83bda35cbc769c4b058c721adef68011d7945d0b30165397ec6d05a53a" --storkContractAddress="${MOCK_STORK_CONTRACT}"`
echo "$OUTPUT"
USDC_CONTRACT=`echo "$OUTPUT" | grep -A 2 "Deploying token named mckUSDC sUSDC" | grep "Token deployed to" |  awk '{print $(NF-2)}'`
USDC_ASSET_ID=`echo "$OUTPUT" | grep -A 2 "Deploying token named mckUSDC sUSDC" | grep "Token deployed to" |  awk '{print $NF}'`
VAULT_CONTRACT=`echo "$OUTPUT" | grep "Vault deployed to" |  awk '{print $NF}'`
PRICEFEED_WRAPPER_CONTRACT=`echo "$OUTPUT" | grep "PricefeedWrapper deployed to" |  awk '{print $NF}'`
if [ -z "$USDC_CONTRACT" ] || [ -z "$USDC_ASSET_ID" ] || [ -z "$VAULT_CONTRACT" ] || [ -z "$PRICEFEED_WRAPPER_CONTRACT" ]; then
    echo "vault deployment failed"
    echo "$OUTPUT"
    docker compose down -v
    exit 1
fi

if [ $1 == "none" ]; then
    echo "Skipping population of events"
else
    echo "Populating events"
    ts-node $1 --mockPricefeedAddress="${MOCK_STORK_CONTRACT}" --vaultAddress="${VAULT_CONTRACT}" --pricefeedWrapperAddress="${PRICEFEED_WRAPPER_CONTRACT}" --usdcAddress="${USDC_CONTRACT}"
    if [ $? -ne 0 ]; then
        echo "Failed to execute the script"
        docker compose down -v
        exit 1
    fi
    echo "Events populated"
fi

# this command builds the project and applies the database migrations along
echo "Starting the squid indexer"
VAULT_PRICEFEED_ADDRESS=${MOCK_STORK_CONTRACT} VAULT_ADDRESS=${VAULT_CONTRACT} E2E_TEST_LOG=1 pnpm sqd process:e2e  2>&1 > indexer.log &
SQD_INDEXER_PID=$!
pnpm sqd serve:e2e  2>&1 > api.log &
API_SERVER_PID=$!

EXIT_CODE=0

if [ $INTERACTIVE -eq 1 ]; then
    echo "Waiting for CTRL-C"
    (trap exit SIGINT; sleep 9999999)
else
    echo "Waiting until the indexer reaches the fuel node height"
    # the target height
    FUEL_NODE_HEIGHT=`curl -s http://127.0.0.1:4000/v1/graphql -X POST -H "Content-Type: application/json" -d '{"query":"query { chain { latestBlock { height } } }"}' | jq -r '.data.chain.latestBlock.height'`
    ii=0
    while [ $ii -lt 20 ]; do
        date
        SQD_INDEXER_TABLE_MARKER=`docker exec "starboard_indexer_db" psql --csv -t -U postgres -c "SELECT COUNT(1) FROM information_schema.tables WHERE table_schema='squid_processor' AND table_name='status'"`
        if [ "$SQD_INDEXER_TABLE_MARKER" -eq "1" ]; then
            SQD_INDEXER_HEIGHT=`docker exec "starboard_indexer_db" psql --csv -t -U postgres -c "SELECT height FROM squid_processor.status WHERE id=0"`
            if [ "$SQD_INDEXER_HEIGHT" -ge "$FUEL_NODE_HEIGHT" ]; then
                break
            fi
        fi
        sleep 1
        ii=$(($ii+1))
    done
    if [ $ii -eq 20 ]; then
        echo "Indexer did not reach the fuel node height within timeout"
        EXIT_CODE=1
    elif [ $2 == "none" ]; then
        echo "Indexer reached the fuel node height"
        echo "Skipping verification of indexer"
    else
        echo "Execute the verification script"
        pnpm test:e2e $2
        EXIT_CODE=$?
    fi
fi

##################### closing #########################################################

echo "clean up the API server"
if [ -n "$API_SERVER_PID" ]; then
    kill_with_children $API_SERVER_PID
    if [ $? -ne 0 ]; then
        echo "Failed to down the API server"
        EXIT_CODE=1
    fi
fi

echo "clean up the squid indexer"
if [ -n "$SQD_INDEXER_PID" ]; then
    kill_with_children $SQD_INDEXER_PID
    if [ $? -ne 0 ]; then
        echo "Failed to down the squid indexer"
        EXIT_CODE=1
    fi
fi

# echo "Shut down Postgres and Fuel Node and erase the indexer data"
# pnpm sqd down:local
# if [ $? -ne 0 ]; then
#     echo "Failed to erase the indexer data"
#     EXIT_CODE=1
# fi

exit $EXIT_CODE
