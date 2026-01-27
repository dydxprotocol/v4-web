import { gql } from 'graphql-request';

export const GET_POSITIONS_BY_ACCOUNT_QUERY = gql`
  query GetPositionsByAccount($account: String!) {
    positionKeys(filter: { account: { equalTo: $account } }) {
      nodes {
        id
        account
        indexAssetId
        isLong
        positions(orderBy: TIMESTAMP_DESC) {
          nodes {
            id
            timestamp
            latest
            change
            collateralDelta
            sizeDelta
            pnlDelta
            outLiquidityFee
            outProtocolFee
            outLiquidationFee
            size
            collateral
            realizedPnl
            outAveragePrice
          }
        }
      }
    }
  }
`;
