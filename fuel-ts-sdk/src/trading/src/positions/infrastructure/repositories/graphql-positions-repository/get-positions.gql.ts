import { gql } from 'graphql-request';

export const GET_POSITIONS_QUERY = gql`
  query GetPositions(
    $limit: Int
    $offset: Int
    $where: PositionFilter
    $orderBy: [PositionsOrderBy!]
  ) {
    positions(offset: $offset, filter: $where, orderBy: $orderBy, first: $limit) {
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

export const GET_POSITION_KEYS_BY_ACCOUNT = gql`
  query GetPositionKeysByAccount($account: String!) {
    positionKeys(filter: { account: { equalTo: $account } }) {
      nodes {
        id
      }
    }
  }
`;
