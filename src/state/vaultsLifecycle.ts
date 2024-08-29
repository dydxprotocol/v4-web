import { kollections } from '@dydxprotocol/v4-abacus';
import { throttle } from 'lodash';

import { PerpetualMarket, VaultAccountCalculator, VaultCalculator } from '@/constants/abacus';

import hookifyHooks from '@/lib/hookify/vanillaHooks';

import { createHookedSelector, useQueryHf } from './appHookedSelectors';
import { setVaultAccount, setVaultDetails, setVaultPositions } from './vaults';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// type StripFunctions<T> = {
//   [K in keyof T as T[K] extends Function ? never : K]: StripFunctions<T[K]>;
// };

async function placeholderFetchMegavaultHistory() {
  await delay(Math.random() * 2000);

  const baseObj = {
    vaultOfVaultsPnl: [
      {
        id: '1',
        createdAt: '0',
        equity: '0',
        totalPnl: '0',
        subaccountId: '0',
        netTransfers: '0',
        blockHeight: '0',
        blockTime: '0',
      },
    ],
  };
  return JSON.stringify(baseObj);
}

async function placeholderFetchSubvaultHistory() {
  await delay(Math.random() * 2000);
  return JSON.stringify({
    vaultsPnl: [
      {
        marketId: 'BTC-USD',
        historicalPnl: [
          {
            id: '1',
            createdAt: '0',
            equity: '0',
            totalPnl: '0',
            subaccountId: '0',
            netTransfers: '0',
            blockHeight: '0',
            blockTime: '0',
          },
        ],
      },
    ],
  });
}

async function placeholderFetchMegavaultPositions() {
  await delay(Math.random() * 2000);
  return JSON.stringify({
    positions: [
      {
        market: 'BTC-USD',
        assetPosition: {
          side: 'LONG',
          size: '100',
          assetId: 'USDC',
          subaccountNumber: 0,
        },
        perpetualPosition: {
          market: 'BTC-USD',
          status: 'OPEN',
          side: 'LONG',
          size: '100',
          maxSize: '100',
          entryPrice: '40000',
          realizedPnl: '0',
          createdAt: '0',
          createdAtHeight: '0',
          sumOpen: undefined,
          sumClose: undefined,
          netFunding: '0',
          unrealizedPnl: undefined,
          closedAt: undefined,
          exitPrice: undefined,
          subaccountNumber: 0,
        },
        equity: '100',
      },
    ],
  });
}

async function placeholderFetchVaultAccount() {
  await delay(Math.random() * 2000);

  const baseObj = {
    address: '0x123',
    shares: 100,
    locked_shares: 0,
    equity: 100,
    withdrawable_amount: 100,
  };
  return JSON.stringify(baseObj);
}

async function placeholderFetchVaultAccountTransfers() {
  await delay(Math.random() * 2000);

  const baseObj = {
    pageSize: 100,
    totalResults: 0,
    offset: 0,
    transfersSubset: [],
    totalNetTransfers: '0',
  };
  return JSON.stringify(baseObj);
}

export const loadedVaultDetails = createHookedSelector([], () => {
  const { data: vaultDetails } = useQueryHf({
    queryKey: ['vaultDetails'],
    queryFn: async () => {
      return VaultCalculator.calculateVaultSummary(
        VaultCalculator.getVaultHistoricalPnlResponse(await placeholderFetchMegavaultHistory())
      );
    },
  });

  return vaultDetails;
}).dispatchValue((dispatch, value) => {
  dispatch(setVaultDetails(value));
});

const MAX_UPDATE_SPEED_MS = 1000 * 60; // one per minute

const debouncedMarketsData = createHookedSelector(
  [(state) => state.perpetuals.rawMarkets],
  (markets) => {
    const latestMarkets = hookifyHooks.useRef(markets);

    const [marketsToReturn, setMarketsToReturn] = hookifyHooks.useState<
      undefined | kollections.Map<string, PerpetualMarket>
    >(undefined);

    hookifyHooks.useEffect(() => {
      latestMarkets.current = markets;
      throttledSync();
    }, [markets]);

    const throttledSync = hookifyHooks.useMemo(
      () =>
        throttle(() => {
          setMarketsToReturn(latestMarkets.current ?? undefined);
        }, MAX_UPDATE_SPEED_MS),
      []
    );

    // if markets is null and we have non-null, force set it
    if (marketsToReturn == null || marketsToReturn.size === 0) {
      if (markets != null && Object.entries(markets).length > 0) {
        setMarketsToReturn((state) => {
          // if it got set by someone else, don't bother
          if (state == null || state.size === 0) {
            return latestMarkets.current ?? markets;
          }
          return state;
        });
      }
    }

    return marketsToReturn;
  }
);

export const loadedVaultPositions = createHookedSelector([debouncedMarketsData], (marketsMap) => {
  const { data: subvaultHistories } = useQueryHf({
    queryKey: ['subvaultHistories'],
    queryFn: async () => {
      return VaultCalculator.getSubvaultHistoricalPnlResponse(
        await placeholderFetchSubvaultHistory()
      );
    },
  });

  const { data: vaultPositions } = useQueryHf({
    queryKey: ['vaultPositions'],
    queryFn: async () => {
      return VaultCalculator.getVaultPositionsResponse(await placeholderFetchMegavaultPositions());
    },
  });

  const calculatedPositions = hookifyHooks.useMemo(() => {
    if (vaultPositions == null || subvaultHistories == null || marketsMap == null) {
      return undefined;
    }
    return VaultCalculator.calculateVaultPositions(vaultPositions, subvaultHistories, marketsMap);
  }, [subvaultHistories, vaultPositions, debouncedMarketsData]);

  return calculatedPositions;
}).dispatchValue((dispatch, value) => {
  dispatch(setVaultPositions(value));
});

export const loadedVaultAccount = createHookedSelector([], () => {
  const { data: accountVault } = useQueryHf({
    queryKey: ['vaultAccount'],
    queryFn: async () => {
      const [acc, transfers] = await Promise.all([
        placeholderFetchVaultAccount(),
        placeholderFetchVaultAccountTransfers(),
      ]);

      const parsedAccount = VaultAccountCalculator.getAccountVaultResponse(acc);
      const parsedTransfers = VaultAccountCalculator.getTransfersBetweenResponse(transfers);

      if (parsedAccount == null || parsedTransfers == null) {
        return undefined;
      }
      return VaultAccountCalculator.calculateUserVaultInfo(parsedAccount, parsedTransfers);
    },
  });
  return accountVault;
}).dispatchValue((dispatch, value) => {
  dispatch(setVaultAccount(value));
});
