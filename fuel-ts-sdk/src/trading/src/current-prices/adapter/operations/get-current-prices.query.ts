import { gql } from 'graphql-request';

export const GET_CURRENT_PRICES_QUERY = gql`
  query GetCurrentPrices(
    $limit: Int
    $offset: Int
    $where: CurrentPriceFilter
    $orderBy: [CurrentPricesOrderBy!]
  ) {
    currentPrices(offset: $offset, filter: $where, orderBy: $orderBy, first: $limit) {
      nodes {
        asset
        price
        timestamp
      }
    }
  }
`;
