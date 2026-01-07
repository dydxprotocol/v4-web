#!/bin/bash

# export $(grep -v '^#' .env.indexer-e2e | xargs)

export DOTENV_CONFIG_PATH=.env.indexer-e2e

export SALT=0x8000000000000000000000000000000000000000000000000000000000000000
export MOCK_STORK_CONTRACT=0x422729Dc06fD5811ec48eDf38915a52aa6383B3a2e91a7f45F1eECaAba2aEf81
export VAULT_CONTRACT=0x01bbCEFbC64350a092310d59E29cFF269DB01539866aBb263f6dB78C275a84F2
export PRICEFEED_WRAPPER_CONTRACT=0x212EB3F8Ff08392B2aa030768A3814fc5A0a67F94412CfE07e37DD1cbC24F9D6
export USDC_CONTRACT=0x9534954321965C4B2dC45712AC3e7B575AFD43C38d2c9834bb5232f5F2BF2c6E
export USDC_ASSET_ID=0xda81350458510a2b4adfb85032ad319a61f271e9ccabe702c96696efc72bc6de

kill_with_children () {
    local pid=$1
    for spid in $(ps -o pid= --ppid $pid); do
        kill_with_children $spid
    done
    kill -15 $pid
}

populate_events() {
  if [ "$1" = "none" ]; then
      echo "Skipping population of events"
  else
      echo "Populating events"
      pnpm exec tsx $1
      if [ $? -ne 0 ]; then
          echo "Failed to execute the script"
          exit 1
      fi
      echo "Events populated"
  fi
}

if [ $# -lt 2 ]; then
    echo "Usage: ./e2e/run.sh <populate-events-script> <verify-indexer-script> <optional i>"
    echo "i - interactive mode, waits for CTRL-C before shutting down"
    echo "scripts can be 'none'"
    exit 1
fi

INTERACTIVE=0
ii=0
for arg in "$@"
do
    if [ $ii -gt 1 ]; then
        if [ $arg = "i" ]; then
            INTERACTIVE=1
        fi
    fi
    ii=$(($ii+1))
done

echo "Deploying Mocked Stork contract" && \
pnpm --filter starboard/contracts deploy:stork-mock --url="http://127.0.0.1:4000/v1/graphql" --privK="0x9e42fa83bda35cbc769c4b058c721adef68011d7945d0b30165397ec6d05a53a" --salt="${SALT}" && \
echo "Deploying the Vault contract" && \
pnpm --filter starboard/contracts setup:testnet --url="http://127.0.0.1:4000/v1/graphql" --privK="0x9e42fa83bda35cbc769c4b058c721adef68011d7945d0b30165397ec6d05a53a" --storkContractAddress="${MOCK_STORK_CONTRACT}" --salt="${SALT}" && \
echo "Building the squid indexer and applying the database migrations" && \
pnpm sqd build && \
pnpm sqd migration:apply && \
populate_events $1

if [ $? -ne 0 ]; then
  echo "Failed, exiting"
  exit 1
fi

echo "Starting the squid indexer"
VAULT_PRICEFEED_ADDRESS=${MOCK_STORK_CONTRACT} VAULT_ADDRESS=${VAULT_CONTRACT} pnpm sqd process > indexer.log 2>&1 &
SQD_INDEXER_PID=$!
pnpm sqd serve > api.log 2>&1 &
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
        SQD_INDEXER_TABLE_MARKER=`docker exec "starboard_indexer_db" psql --csv -t -U postgres -c "SELECT COUNT(1) FROM information_schema.tables WHERE table_schema='squid_processor' AND table_name='status'"`
        SQD_INDEXER_TABLE_MARKER=$(echo "$SQD_INDEXER_TABLE_MARKER" | tr -d '[:space:]')
        if [ "$SQD_INDEXER_TABLE_MARKER" -eq "1" ]; then
            SQD_INDEXER_HEIGHT=`docker exec "starboard_indexer_db" psql --csv -t -U postgres -c "SELECT height FROM squid_processor.status WHERE id=0"`
            SQD_INDEXER_HEIGHT=$(echo "$SQD_INDEXER_HEIGHT" | tr -d '[:space:]')
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

exit $EXIT_CODE
