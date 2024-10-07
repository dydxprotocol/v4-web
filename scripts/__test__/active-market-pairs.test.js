import { describe, expect, it, vi } from 'vitest';
import { fetchActiveMarketPairs } from '../markets/active-market-pairs';

global.fetch = vi.fn();

describe('fetchActiveMarketPairs', () => {
  it('should return only active market pairs', async () => {
    const mockMarketsResponse = {
      market_params: [
        { id: '1', pair: 'BTC-USD' },
        { id: '2', pair: 'ETH-USD' },
      ],
      pagination: {}
    };

    const mockClobPairsPage1 = {
      clob_pair: [{ id: '1', status: 'STATUS_ACTIVE' }],
      pagination: { next_key: 'page2' }
    };

    const mockClobPairsPage2 = {
      clob_pair: [{ id: '2', status: 'STATUS_INACTIVE' }],
      pagination: {}
    };

    fetch.mockImplementation((url) => ({
      status: 200,
      json: async () => {
        if (url.includes('market')) {
          return mockMarketsResponse;
        }
        if (url.includes('clob_pair')) {
          return url.includes('pagination.key=page2')
            ? mockClobPairsPage2
            : mockClobPairsPage1;
        }
        return {};
      }
    }));

    const result = await fetchActiveMarketPairs('https://example.com');

    expect(result).toEqual(['BTC-USD']);
    expect(fetch).toHaveBeenCalledTimes(3);
  });
});

vi.restoreAllMocks();
