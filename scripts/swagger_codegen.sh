#!/bin/sh

CURRENT_DIR=$(pwd)

# Defining a temporary directory for cloning
TMP_DIR=$(mktemp -d)

# Function to clean up the temporary directory
cleanup() {
    echo "Cleaning up..."
    rm -rf "$TMP_DIR"
}

# Trap to clean up in case of script exit or interruption
trap cleanup EXIT

curl -o $TMP_DIR/swagger.json https://raw.githubusercontent.com/dydxprotocol/v4-chain/main/indexer/services/comlink/public/swagger.json

cd "$TMP_DIR"

swagger-codegen generate -i swagger.json -o generated -l typescript-fetch

# a bunch of one off fixes to massage this thing into a reasonable state, probably very fragile
sed -i '' '1,79d; /export const DefaultApiFetchParamCreator/,$d' generated/api.ts
sed -i '' -e ':a' -e '$d;N;2,4ba' -e 'P;D' generated/api.ts
line_num=$(grep -n "export interface SparklineResponseObject" generated/api.ts | cut -d: -f1) && sed -i '' "$((line_num-5)),$((line_num+3))d" generated/api.ts
line_num=$(grep -n "export interface PerpetualPositionsMap" generated/api.ts | cut -d: -f1) && sed -i '' "$((line_num-5)),$((line_num+3))d" generated/api.ts
line_num=$(grep -n "export interface AssetPositionsMap" generated/api.ts | cut -d: -f1) && sed -i '' "$((line_num-5)),$((line_num+3))d" generated/api.ts
sed -i '' '/markets: { \[key: string\]: PerpetualMarketResponseObject; };/s/;$//' generated/api.ts
sed -i '' 's/openPerpetualPositions: PerpetualPositionsMap;/openPerpetualPositions: { [market: string]: PerpetualPositionResponseObject };/' generated/api.ts
sed -i '' 's/assetPositions: AssetPositionsMap;/assetPositions: { [symbol: string]: AssetPositionResponseObject };/' generated/api.ts
sed -i '' 's/= <any>/=/' generated/api.ts

rm -f $CURRENT_DIR/src/types/indexer/indexerApiGen.ts
mv generated/api.ts  $CURRENT_DIR/src/types/indexer/indexerApiGen.ts

cd $CURRENT_DIR

npx tsx scripts/indexer-renames.ts 
pnpm prettier ./src/types/indexer/indexerApiGen.ts --write
sed -i '' 's/export interface IndexerAPIOrderStatus {}/export type IndexerAPIOrderStatus = IndexerOrderStatus | IndexerBestEffortOpenedStatus;/' ./src/types/indexer/indexerApiGen.ts
