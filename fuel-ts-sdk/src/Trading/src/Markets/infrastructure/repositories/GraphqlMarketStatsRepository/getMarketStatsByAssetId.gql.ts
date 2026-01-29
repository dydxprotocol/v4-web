import { gql } from 'graphql-request';

export const GET_MARKET_STATS_QUERY = gql`
  query GetMarketStats($indexAssetId: String!) {
    openInterests(condition: { indexAssetId: $indexAssetId }) {
      nodes {
        openInterestLong
        openInterestShort
      }
    }
    tradeVolume24Hs(condition: { indexAssetId: $indexAssetId }) {
      nodes {
        tradeVolume
      }
    }
  }
`;

export interface GetMarketStatsQueryVariables {
  indexAssetId: string;
}

export interface GetMarketStatsQueryResult {
  openInterests: {
    nodes: Array<{
      openInterestLong: string;
      openInterestShort: string;
    }>;
  };
  tradeVolume24Hs: {
    nodes: Array<{
      tradeVolume: string;
    }>;
  };
}
