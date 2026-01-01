import { gql } from 'graphql-request';

export const GET_POSITIONS_BY_ACCOUNT_QUERY = gql`
  query GetPositionsByAccount($account: String!, $latestOnly: Boolean) {
    positions(
      filter: { positionKey: { account: { equalTo: $account } }, latest: { equalTo: $latestOnly } }
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
        collateralAmount
        size
        timestamp
        latest
        change
        collateralTransferred
        positionFee
        fundingRate
        pnlDelta
        realizedFundingRate
        realizedPnl
      }
    }
  }
`;
