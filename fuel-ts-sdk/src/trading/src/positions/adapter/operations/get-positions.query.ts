import { gql } from 'graphql-request';

export const GET_POSITIONS_QUERY = gql`
query GetPositions($limit: Int, $offset: Int, $where: PositionFilter, $orderBy: [PositionsOrderBy!]) {
  positions(
    offset: $offset
    filter: $where
    orderBy: $orderBy
    first: $limit
  ) {
    nodes {
      id
      positionKey {
        account
        id
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
