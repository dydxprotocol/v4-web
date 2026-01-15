import { gql } from 'graphql-request';

export const GET_POSITIONS_BY_KEY_ID_QUERY = gql`
  query GetPositionsByKeyId($positionKeyId: String!, $latestOnly: Boolean) {
    positions(
      filter: { positionKey: { id: { equalTo: $positionKeyId } }, latest: { equalTo: $latestOnly } }
      orderBy: TIMESTAMP_DESC
    ) {
      nodes {
        id
        positionKey {
          id
          account
          indexAssetId
          isLong
        }
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
`;
