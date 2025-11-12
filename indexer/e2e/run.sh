#!/bin/bash

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

echo "Starting the fuel node"
FUEL_NODE_OUT=`(pnpm --filter starboard/contracts run:node 2>&1 &) | grep -m 1 "Node is up" | wc -l`
if [ "$FUEL_NODE_OUT" -ne "1" ]; then
    echo "fuel node failed to start"
    exit 1
fi

# cannot use FUEL_NODE_PID=$!, use walkaround to get the process id
FUEL_NODE_PID=`pgrep -A "fuel-core"`
if [ -z "$FUEL_NODE_PID" ]; then
    echo "fuel node process is down"
    exit 1
fi

echo "Deploying Mocked Stork contract"
# priv key is hardcoded, taken form the fuel node starting script
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

if [ $1 == "none" ]; then
    echo "Skipping population of events"
else
    echo "Populating events"
    ts-node $1 --mockPricefeedAddress="${MOCK_STORK_CONTRACT}" --vaultAddress="${VAULT_CONTRACT}" --usdcAddress="${USDC_CONTRACT}"
    if [ $? -ne 0 ]; then
        echo "Failed to execute the script"
        kill $FUEL_NODE_PID
        EXIT_CODE=1
    fi
    echo "Events populated"
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
    # theindexerstoppedunexpectedly is the guardian to indicate that the indexer stopped unexpectedly
    # we want the indexer log for the post processing
    { VAULT_PRICEFEED_ADDRESS=${MOCK_STORK_CONTRACT} VAULT_ADDRESS=${VAULT_CONTRACT} E2E_TEST_LOG=1 pnpm start:e2e 2>&1 | tee indexer.log > /dev/null; echo "theindexerstoppedunexpectedly" >> indexer.log; } &
    sleep 1

    # there is doouble grep, first greps also the guardian in order to stop the tailing if the indexer stopped unexpectedly,
    # second grep is to check if the indexer actually started
    SQD_INDEXER_OUT=`tail -f -n +1 indexer.log | grep -m 1 "Indexer run started\|theindexerstoppedunexpectedly" | grep "Indexer run started" | wc -l`
    if [ "$SQD_INDEXER_OUT" -ne "1" ]; then
        echo "squid indexer failed to start"
        cat indexer.log
        EXIT_CODE=1
    fi

    # cannot use SQD_INDEXER_PID=$!, use walkaround to get the process id
    SQD_INDEXER_PNPM_PID=`pgrep -A -n pnpm`
    # this is bad, but I have no clue how to improve it
    # pnpm starts the indexer the way that killing pnpm process does not kill the indexer process
    # now we check if pnpm process is 'pnpm start:ci' and the indexer process in newer
    # NOTE: this depends on how the indexer is started by pnpm, and this is a bad practice
    SQD_INDEXER_PID=`pgrep -A -n node`
    # need to check if pnpm process is the process that started the indexer
    # tr is the trick because /proc/PID/cmdline is a null-whitespace string
    SQD_INDEXER_PID_CHECK=`cat /proc/$SQD_INDEXER_PNPM_PID/cmdline | tr '\0' ' ' | grep "pnpm start:ci" | wc -l`
    if [ "$SQD_INDEXER_PID_CHECK" -ne 1 ]; then
        SQD_INDEXER_PID=""
    elif [ -z "$SQD_INDEXER_PID" ]; then
        SQD_INDEXER_PID=""
    elif [ "$SQD_INDEXER_PNPM_PID" -gt "$SQD_INDEXER_PID" ]; then
        SQD_INDEXER_PID=""
    fi

    # if [ -z "$SQD_INDEXER_PID" ]; then
    #     echo "squid indexer process is down"
    #     cat indexer.log
    #     EXIT_CODE=1
    # fi

    if [ $EXIT_CODE -eq 0 ]; then
        if [ $INTERACTIVE -eq 1 ]; then
            echo "Waiting for CTRL-C"
            (trap exit SIGINT; sleep 9999999)
        else
            echo "Waiting until the indexer reaches the fuel node height"
            # the target height
            FUEL_NODE_HEIGHT=`curl -s http://127.0.0.1:4000/v1/graphql -X POST -H "Content-Type: application/json" -d '{"query":"query { chain { latestBlock { height } } }"}' | jq -r '.data.chain.latestBlock.height'`
            ii=0
            while [ $ii -lt 10 ]; do
                SQD_INDEXER_HEIGHT=`docker exec "indexer-db-1" psql --csv -t -U postgres -c "select height from squid_processor.status where id=0"`
                if [ "$SQD_INDEXER_HEIGHT" -ge "$FUEL_NODE_HEIGHT" ]; then
                    break
                fi
                sleep 1
                ii=$(($ii+1))
            done
            if [ $ii -eq 10 ]; then
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
    fi
fi

##################### closing #########################################################

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
