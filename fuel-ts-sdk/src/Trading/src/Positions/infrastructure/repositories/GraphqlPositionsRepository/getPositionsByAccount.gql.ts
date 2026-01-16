import { gql } from 'graphql-request';

export const GET_POSITIONS_BY_ACCOUNT_QUERY = gql`
  query GetPositionsByAccount($account: String!, $latestOnly: Boolean) {
    positionKeys(filter: { account: { equalTo: $account } }) {
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
