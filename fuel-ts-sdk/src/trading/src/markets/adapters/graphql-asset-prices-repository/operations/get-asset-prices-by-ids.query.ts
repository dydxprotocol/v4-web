import { gql } from 'graphql-request';

export const GET_ASSET_PRICES_BY_IDS_QUERY = gql`
  query GetAssetPricesByIds($assetIds: [String!]!) {
    prices(where: { asset_in: $assetIds }) {
      asset
      price
      timestamp
    }
  }
`;
