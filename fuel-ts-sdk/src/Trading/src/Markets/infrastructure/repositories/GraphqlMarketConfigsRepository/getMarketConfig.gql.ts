import { gql } from 'graphql-request';

export const GET_MARKET_CONFIG_QUERY = gql`
  query GetMarketConfig($assetId: String!) {
    market(id: $assetId) {
      asset
      initialMarginFraction
      maintenanceMarginFraction
      tickSizeDecimals
      stepSizeDecimals
    }
  }
`;
