import { gql } from 'graphql-request';

export const GET_POSITIONS_QUERY = gql`
  query GetPositions(
    $limit: Int
    $offset: Int
    $where: PositionWhereInput
    $orderBy: [PositionOrderByInput!]
  ) {
    positions(limit: $limit, offset: $offset, where: $where, orderBy: $orderBy) {
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
`;
