import { useQuery } from '@tanstack/react-query';

import { timeUnits } from '@/constants/time';
import { IndexerPnlTicksResponseObject } from '@/types/indexer/indexerApiGen';
import { isIndexerHistoricalPnlResponse } from '@/types/indexer/indexerChecks';

import { getSubaccountId, getUserWalletAddress } from '@/state/accountInfoSelectors';
import { useAppSelector } from '@/state/appTypes';

import { mapIfPresent } from '@/lib/do';
import { MustNumber } from '@/lib/numbers';
import { isPresent } from '@/lib/typeUtils';

import { queryResultToLoadable } from './lib/queryResultToLoadable';
import { useIndexerClient } from './lib/useIndexer';

const MAX_REQUESTS = 15;
const MAX_TIME_DAYS = 91;

export interface SubaccountPnlTick {
  equity: number;
  totalPnl: number;
  createdAtMilliseconds: number;
}

function toPnlPoint(tick: IndexerPnlTicksResponseObject): SubaccountPnlTick {
  return {
    equity: MustNumber(tick.equity),
    totalPnl: MustNumber(tick.totalPnl),
    createdAtMilliseconds: new Date(tick.createdAt).getTime(),
  };
}

export function useParentSubaccountHistoricalPnls() {
  const address = useAppSelector(getUserWalletAddress);
  const subaccount = useAppSelector(getSubaccountId);
  const { indexerClient, key: indexerKey } = useIndexerClient();

  return queryResultToLoadable(
    useQuery({
      enabled: isPresent(address) && isPresent(subaccount) && isPresent(indexerClient),
      queryKey: ['indexer', 'account', 'historicalPnl', address, subaccount, indexerKey],
      queryFn: async () => {
        if (address == null || subaccount == null || indexerClient == null) {
          throw new Error('Invalid historical pnl query state');
        }

        const allResults: IndexerPnlTicksResponseObject[] = [];
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, no-constant-condition
        for (let request = 0; request < MAX_REQUESTS; request += 1) {
          // eslint-disable-next-line no-await-in-loop
          const thisResult = await indexerClient.account.getParentSubaccountNumberHistoricalPNLs(
            address,
            subaccount,
            undefined,
            // one second before oldest current result
            mapIfPresent(allResults.at(-1), (r) =>
              new Date(new Date(r.createdAt).getTime() - timeUnits.second).toISOString()
            ) ?? undefined
          );
          const typedResult = isIndexerHistoricalPnlResponse(thisResult);

          // we discard the final item because the indexer incorrectly computes this datapoint on nearly every request
          // the bug only happens when we're at the end of the page though, so we don't do it for arrays of length 1
          const resultArr =
            typedResult.historicalPnl.length > 1
              ? typedResult.historicalPnl.slice(0, -1)
              : typedResult.historicalPnl;

          // so this only happens when the actual response was empty
          if (resultArr.length === 0) {
            break;
          }

          allResults.push(...resultArr);

          if (
            allResults.length > 0 &&
            new Date(allResults.at(-1)!.createdAt).getTime() <
              new Date().getTime() - timeUnits.day * MAX_TIME_DAYS
          ) {
            break;
          }
        }
        return allResults.map(toPnlPoint).reverse();
      },
      refetchInterval: timeUnits.hour,
      staleTime: timeUnits.hour,
    })
  );
}
