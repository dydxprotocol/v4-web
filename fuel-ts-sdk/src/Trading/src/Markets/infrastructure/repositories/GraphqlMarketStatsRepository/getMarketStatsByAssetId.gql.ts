import { gql } from 'graphql-request';

export const GET_MARKET_STATS_QUERY = gql`
  query GetMarketStats($indexAssetId: String!) {
    openInterests(condition: { indexAssetId: $indexAssetId }, first: 1) {
      nodes {
        openInterestLong
        openInterestShort
      }
    }
    tradeVolume24Hs(condition: { indexAssetId: $indexAssetId }, first: 1) {
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
