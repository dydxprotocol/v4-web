import { wrapAndLogBonsaiError } from '@/bonsai/logs';
import { useQuery } from '@tanstack/react-query';

import { timeUnits } from '@/constants/time';

import { SpotHeaderToken } from '@/pages/spot/types';

import { searchSpotTokens } from '@/clients/spotApi';

import { useDebounce } from './useDebounce';
import { useEndpointsConfig } from './useEndpointsConfig';

export const useSpotTokenSearch = (query: string, debounceMs = 300) => {
  const spotApiEndpoint = useEndpointsConfig().spotApi;
  const debouncedQuery = useDebounce(query, debounceMs);

  return useQuery({
    queryKey: ['spotTokenSearch', debouncedQuery],
    queryFn: wrapAndLogBonsaiError(async (): Promise<SpotHeaderToken[]> => {
      const res = await searchSpotTokens(spotApiEndpoint, debouncedQuery);
      return res.tokens.map((token) => ({
        name: token.name,
        symbol: token.symbol,
        tokenAddress: token.mint,
        change24hPercent: token.priceChangePercent24h,
        marketCapUsd: token.marketCapUSD,
        markPriceUsd: token.priceUsd,
        logoUrl: token.imageLg ?? token.imageSm,
        priceUsd: token.priceUsd,
        volume24hUsd: token.volumeUsd,
      }));
    }, 'spotTokenSearch'),
    staleTime: timeUnits.minute,
  });
};
