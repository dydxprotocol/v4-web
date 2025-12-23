import { gql } from 'graphql-request';

export const GET_POSITIONS_QUERY = gql`
query GetPositions($limit: Int, $offset: Int, $where: PositionWhereInput, $orderBy: [PositionOrderByInput!]) {
  positions(
    offset: $offset
    where: $where
    orderBy: $orderBy
    limit: $limit
  ) {
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
`;
