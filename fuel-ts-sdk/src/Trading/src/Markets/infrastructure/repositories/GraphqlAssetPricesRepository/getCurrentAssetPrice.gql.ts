import { gql } from 'graphql-request';

export const GET_CURRENT_ASSET_PRICES_QUERY = gql`
  query GetCurrentAssetPrices($asset: String) {
    currentPrices(first: 1, condition: { asset: $asset }) {
      nodes {
        asset
        price
        timestamp
      }
    }
  }
`;
