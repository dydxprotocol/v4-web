import { gql } from 'graphql-request';

/**
 * GraphQL queries for fetching candles by interval
 * Each interval has its own query field (candlesD1, candlesH1, etc.)
 */
export const GET_CANDLES_D1_QUERY = gql`
query GetCandlesD1($limit: Int, $offset: Int, $where: CandleD1Filter, $orderBy: [CandleD1sOrderBy!]) {
  candleD1s(
    offset: $offset
    filter: $where
    orderBy: $orderBy
    first: $limit
  ) {
    nodes {
      asset
      closePrice
      highPrice
      lowPrice
      startedAt
    }
  }
}
`;

export const GET_CANDLES_H1_QUERY = gql`
query GetCandlesH1($limit: Int, $offset: Int, $where: CandleH1Filter, $orderBy: [CandleH1sOrderBy!]) {
  candleH1s(
    offset: $offset
    filter: $where
    orderBy: $orderBy
    first: $limit
  ) {
    nodes {
      asset
      closePrice
      highPrice
      lowPrice
      startedAt
    }
  }
}
`;

export const GET_CANDLES_H4_QUERY = gql`
query GetCandlesH4($limit: Int, $offset: Int, $where: CandleH4Filter, $orderBy: [CandleH4sOrderBy!]) {
  candleH4s(
    offset: $offset
    filter: $where
    orderBy: $orderBy
    first: $limit
  ) {
    nodes {
      asset
      closePrice
      highPrice
      lowPrice
      startedAt
    }
  }
}
`;

export const GET_CANDLES_M1_QUERY = gql`
query GetCandlesM1($limit: Int, $offset: Int, $where: CandleM1Filter, $orderBy: [CandleM1sOrderBy!]) {
  candleM1s(
    offset: $offset
    filter: $where
    orderBy: $orderBy
    first: $limit
  ) {
    nodes {
      asset
      closePrice
      highPrice
      lowPrice
      startedAt
    }
  }
}
`;

export const GET_CANDLES_M5_QUERY = gql`
query GetCandlesM5($limit: Int, $offset: Int, $where: CandleM5Filter, $orderBy: [CandleM5sOrderBy!]) {
  candleM5s(
    offset: $offset
    filter: $where
    orderBy: $orderBy
    first: $limit
  ) {
    nodes {
      asset
      closePrice
      highPrice
      lowPrice
      startedAt
    }
  }
}
`;

export const GET_CANDLES_M15_QUERY = gql`
query GetCandlesM15($limit: Int, $offset: Int, $where: CandleM15Filter, $orderBy: [CandleM15sOrderBy!]) {
  candleM15s(
    offset: $offset
    filter: $where
    orderBy: $orderBy
    first: $limit
  ) {
    nodes {
      asset
      closePrice
      highPrice
      lowPrice
      startedAt
    }
  }
}
`;

export const GET_CANDLES_M30_QUERY = gql`
query GetCandlesM30($limit: Int, $offset: Int, $where: CandleM30Filter, $orderBy: [CandleM30sOrderBy!]) {
  candleM30s(
    offset: $offset
    filter: $where
    orderBy: $orderBy
    first: $limit
  ) {
    nodes {
      asset
      closePrice
      highPrice
      lowPrice
      startedAt
    }
  }
}
`;
