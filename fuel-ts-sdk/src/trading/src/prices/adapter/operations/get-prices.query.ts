import { gql } from 'graphql-request';

export const GET_PRICES_QUERY = gql`
  query GetPrices($limit: Int, $offset: Int, $where: PriceFilter, $orderBy: [PricesOrderBy!]) {
    prices(offset: $offset, filter: $where, orderBy: $orderBy, first: $limit) {
      nodes {
        id
        asset
        price
        timestamp
      }
    }
  }
`;
