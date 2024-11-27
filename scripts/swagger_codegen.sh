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

# Remove required attribute
# ${CURRENT_DIR}/json_remove_attr.sh -f $TMP_DIR/swagger.json -a required

# Remove APIOrderStatus
# ${CURRENT_DIR}/json_remove_attr.sh -f  $TMP_DIR/swagger.json -a APIOrderStatus

# Codegen doesn't support allOf with enum, so we need to replace it with the enum directly

# Add APIOrderStatus with content of OrderStatus and BestEffortOrderStatus
# ${CURRENT_DIR}/json_add_attr.sh $TMP_DIR/swagger.json '.components.schemas' APIOrderStatus TO_REPLACE

# Remove "TO_REPLACE" with the content of OrderStatus and BestEffortOrderStatus
# sed -i '' "s/\"TO_REPLACE\"/{ \"enum\": [\"OPEN\",\"FILLED\",\"CANCELED\",\"BEST_EFFORT_CANCELED\",\"UNTRIGGERED\",\"BEST_EFFORT_OPENED\"],\"type\": \"string\" }/g" $TMP_DIR/swagger.json 

cd "$TMP_DIR"

swagger-codegen generate -i swagger.json -o generated -l typescript-fetch

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


