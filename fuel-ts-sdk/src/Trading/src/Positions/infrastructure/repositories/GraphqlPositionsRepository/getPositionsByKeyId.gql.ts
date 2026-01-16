import { gql } from 'graphql-request';

export const GET_POSITIONS_BY_KEY_ID_QUERY = gql`
  query GetPositionsByKeyId($positionKeyId: String!, $latestOnly: Boolean) {
    positionKeys(filter: { id: { equalTo: $positionKeyId } }) {
      nodes {
        id
        account
        indexAssetId
        isLong
        positions(filter: { latest: { equalTo: $latestOnly } }, orderBy: TIMESTAMP_DESC) {
          nodes {
            id
            collateral
            size
            timestamp
            latest
            change
            collateralDelta
            outLiquidityFee
            outProtocolFee
            outLiquidationFee
            fundingRate
            pnlDelta
            realizedFundingRate
            realizedPnl
          }
        }
      }
    }
  }
`;
