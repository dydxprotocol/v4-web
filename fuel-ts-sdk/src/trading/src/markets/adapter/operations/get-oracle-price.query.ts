import { gql } from 'graphql-request';

export const GET_ORACLE_PRICE_QUERY = gql`
  query GetOraclePrice($assetId: String!) {
    price(id: $assetId) {
      asset
      price
      timestamp
    }
  }
`;

export const GET_ORACLE_PRICES_QUERY = gql`
  query GetOraclePrices($assetIds: [String!]!) {
    prices(where: { asset_in: $assetIds }) {
      asset
      price
      timestamp
    }
  }
`;
