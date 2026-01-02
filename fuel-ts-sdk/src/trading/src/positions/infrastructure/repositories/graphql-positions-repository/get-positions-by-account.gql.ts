import { gql } from 'graphql-request';

export const GET_POSITION_KEYS_BY_ACCOUNT_QUERY = gql`
  query GetPositionKeysByAccount($account: String!) {
    positionKeys(filter: { account: { equalTo: $account } }) {
      nodes {
        id
      }
    }
  }
`;

export const GET_POSITIONS_BY_KEY_IDS_QUERY = gql`
  query GetPositionsByKeyIds($positionKeyIds: [String!]!, $latestOnly: Boolean) {
    positions(
      filter: { positionKeyId: { in: $positionKeyIds }, latest: { equalTo: $latestOnly } }
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
