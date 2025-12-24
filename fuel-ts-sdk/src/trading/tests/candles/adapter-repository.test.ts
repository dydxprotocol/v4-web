import type { GraphQLClient } from 'graphql-request';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  CandleD1,
  CandleH1,
  CandleH4,
  CandleM1,
  CandleM5,
  CandleM15,
  CandleM30,
} from '@/generated/graphql';
import { createGraphQLCandleRepository } from '../../src/candles';
import type { CandleInterval } from '../../src/candles';

describe('Candle Repository Adapter', () => {
  let mockClient: GraphQLClient;
  let mockRequest: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRequest = vi.fn();
    mockClient = {
      request: mockRequest,
    } as unknown as GraphQLClient;
  });

  const intervals: CandleInterval[] = ['D1', 'H1', 'H4', 'M1', 'M5', 'M15', 'M30'];

  const mockGraphQLCandles: Array<
    CandleD1 | CandleH1 | CandleH4 | CandleM1 | CandleM5 | CandleM15 | CandleM30
  > = [
    {
      __typename: 'CandleD1',
      id: 'candle-001',
      asset: '0xasset123',
      closePrice: '1000000',
      highPrice: '1100000',
      lowPrice: '900000',
      startedAt: 1234567890,
    } as CandleD1,
    {
      __typename: 'CandleH1',
      id: 'candle-002',
      asset: '0xasset456',
      closePrice: '2000000',
      highPrice: '2200000',
      lowPrice: '1800000',
      startedAt: 1234567900,
    } as CandleH1,
    {
      __typename: 'CandleM1',
      id: 'candle-003',
      asset: '0xasset123',
      closePrice: '1500000',
      highPrice: '1600000',
      lowPrice: '1400000',
      startedAt: 1234567910,
    } as CandleM1,
  ];

  const getQueryFieldForInterval = (interval: CandleInterval): string => {
    switch (interval) {
      case 'D1':
        return 'candleD1s';
      case 'H1':
        return 'candleH1s';
      case 'H4':
        return 'candleH4s';
      case 'M1':
        return 'candleM1s';
      case 'M5':
        return 'candleM5s';
      case 'M15':
        return 'candleM15s';
      case 'M30':
        return 'candleM30s';
    }
  };

  describe('getCandles', () => {
    intervals.forEach((interval) => {
      it(`should fetch candles with default options for interval ${interval}`, async () => {
        const queryField = getQueryFieldForInterval(interval);
        mockRequest.mockResolvedValue({ [queryField]: { nodes: [mockGraphQLCandles[0]] } });

        const repository = createGraphQLCandleRepository(mockClient);
        const candles = await repository.getCandles({ interval });

        expect(mockRequest).toHaveBeenCalledTimes(1);
        expect(candles).toHaveLength(1);
        expect(candles[0]?.asset).toBe('0xasset123');
        expect(candles[0]?.closePrice).toBe(BigInt(1000000));
        expect(candles[0]?.highPrice).toBe(BigInt(1100000));
        expect(candles[0]?.lowPrice).toBe(BigInt(900000));
      });
    });

    intervals.forEach((interval) => {
      it(`should apply limit and offset options for interval ${interval}`, async () => {
        const queryField = getQueryFieldForInterval(interval);
        mockRequest.mockResolvedValue({ [queryField]: { nodes: [mockGraphQLCandles[0]] } });

        const repository = createGraphQLCandleRepository(mockClient);
        await repository.getCandles({ interval, limit: 10, offset: 5 });

        expect(mockRequest).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            limit: 10,
            offset: 5,
          })
        );
      });
    });

    intervals.forEach((interval) => {
      it(`should use default limit and offset when not provided for interval ${interval}`, async () => {
        const queryField = getQueryFieldForInterval(interval);
        mockRequest.mockResolvedValue({ [queryField]: { nodes: mockGraphQLCandles } });

        const repository = createGraphQLCandleRepository(mockClient);
        await repository.getCandles({ interval });

        expect(mockRequest).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            limit: 100,
            offset: 0,
          })
        );
      });
    });

    intervals.forEach((interval) => {
      it(`should filter by asset for interval ${interval}`, async () => {
        const queryField = getQueryFieldForInterval(interval);
        mockRequest.mockResolvedValue({
          [queryField]: { nodes: [mockGraphQLCandles[0], mockGraphQLCandles[2]] },
        });

        const repository = createGraphQLCandleRepository(mockClient);

        await repository.getCandles({ interval, asset: '0xasset123' });

        expect(mockRequest).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            where: expect.objectContaining({
              asset_eq: '0xasset123',
            }),
          })
        );
      });
    });

    intervals.forEach((interval) => {
      it(`should apply default orderBy as STARTED_AT_DESC for interval ${interval}`, async () => {
        const queryField = getQueryFieldForInterval(interval);
        mockRequest.mockResolvedValue({ [queryField]: { nodes: mockGraphQLCandles } });

        const repository = createGraphQLCandleRepository(mockClient);

        await repository.getCandles({ interval });

        expect(mockRequest).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            orderBy: ['STARTED_AT_DESC'],
          })
        );
      });
    });

    intervals.forEach((interval) => {
      it(`should apply custom orderBy for interval ${interval}`, async () => {
        const queryField = getQueryFieldForInterval(interval);
        mockRequest.mockResolvedValue({ [queryField]: { nodes: mockGraphQLCandles } });

        const repository = createGraphQLCandleRepository(mockClient);

        await repository.getCandles({ interval, orderBy: 'STARTED_AT_ASC' });

        expect(mockRequest).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            orderBy: ['STARTED_AT_ASC'],
          })
        );
      });
    });

    intervals.forEach((interval) => {
      it(`should combine multiple options for interval ${interval}`, async () => {
        const queryField = getQueryFieldForInterval(interval);
        mockRequest.mockResolvedValue({ [queryField]: { nodes: [mockGraphQLCandles[0]] } });

        const repository = createGraphQLCandleRepository(mockClient);

        await repository.getCandles({
          interval,
          asset: '0xasset123',
          limit: 5,
          offset: 10,
          orderBy: 'STARTED_AT_ASC',
        });

        expect(mockRequest).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            limit: 5,
            offset: 10,
            where: expect.objectContaining({
              asset_eq: '0xasset123',
            }),
            orderBy: ['STARTED_AT_ASC'],
          })
        );
      });
    });

    intervals.forEach((interval) => {
      it(`should not include where clause when no filters provided for interval ${interval}`, async () => {
        const queryField = getQueryFieldForInterval(interval);
        mockRequest.mockResolvedValue({ [queryField]: { nodes: mockGraphQLCandles } });

        const repository = createGraphQLCandleRepository(mockClient);

        await repository.getCandles({ interval });

        expect(mockRequest).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            where: undefined,
          })
        );
      });
    });

    intervals.forEach((interval) => {
      it(`should convert GraphQL candles to domain candles correctly for interval ${interval}`, async () => {
        const queryField = getQueryFieldForInterval(interval);
        mockRequest.mockResolvedValue({ [queryField]: { nodes: [mockGraphQLCandles[0]] } });

        const repository = createGraphQLCandleRepository(mockClient);
        const candles = await repository.getCandles({ interval });

        expect(candles).toHaveLength(1);
        expect(candles[0]?.asset).toBe('0xasset123');
        expect(candles[0]?.closePrice).toBe(BigInt(1000000));
        expect(candles[0]?.highPrice).toBe(BigInt(1100000));
        expect(candles[0]?.lowPrice).toBe(BigInt(900000));
        expect(candles[0]?.startedAt).toBe(1234567890);
        expect(typeof candles[0]?.closePrice).toBe('bigint');
        expect(typeof candles[0]?.highPrice).toBe('bigint');
        expect(typeof candles[0]?.lowPrice).toBe('bigint');
        expect(Number.isInteger(candles[0]?.startedAt)).toBe(true);
      });
    });

    intervals.forEach((interval) => {
      it(`should handle empty results for interval ${interval}`, async () => {
        const queryField = getQueryFieldForInterval(interval);
        mockRequest.mockResolvedValue({ [queryField]: { nodes: [] } });

        const repository = createGraphQLCandleRepository(mockClient);
        const candles = await repository.getCandles({ interval });

        expect(candles).toHaveLength(0);
        expect(Array.isArray(candles)).toBe(true);
      });
    });
  });
});
