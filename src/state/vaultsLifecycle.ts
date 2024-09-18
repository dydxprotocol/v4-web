import { kollections } from '@dydxprotocol/v4-abacus';
import BigNumber from 'bignumber.js';
import { throttle } from 'lodash';

import {
  PerpetualMarket,
  VaultAccountCalculator,
  VaultCalculator,
  VaultDepositWithdrawFormValidator,
  VaultFormAccountData,
  VaultFormAction,
  VaultFormData,
} from '@/constants/abacus';

import abacusStateManager from '@/lib/abacus';
import { assertNever } from '@/lib/assertNever';
import hookifyHooks from '@/lib/hookify/vanillaHooks';
import { MustBigNumber } from '@/lib/numbers';

import { createHookedSelector, useQueryHf } from './appHookedSelectors';
import { createAppSelector } from './appTypes';
import {
  setVaultAccount,
  setVaultDetails,
  setVaultFormSlippageResponse,
  setVaultFormValidationResponse,
  setVaultPositions,
} from './vaults';

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
        equity: '1000',
        totalPnl: '1000',
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
          side: 'SHORT',
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

async function placeholderFetchVaultFormSlippage(shares: number, resultAmountTemporary: number) {
  await delay(Math.random() * 2000);

  const baseObj = {
    shares,
    expectedAmount: resultAmountTemporary,
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

const vaultQueryOptions = {
  staleTime: 1000 * 60,
  refetchInterval: 1000 * 60 * 2,
};
export const loadedVaultDetails = createHookedSelector([], () => {
  const { data: vaultDetails } = useQueryHf({
    queryKey: ['vaultDetails'],
    queryFn: async () => {
      return wrapNullable(
        VaultCalculator.calculateVaultSummary(
          VaultCalculator.getVaultHistoricalPnlResponse(await placeholderFetchMegavaultHistory())
        )
      );
    },
    ...vaultQueryOptions,
  });

  return vaultDetails?.data;
}).dispatchValue((dispatch, value) => {
  dispatch(setVaultDetails(value));
});

const MAX_UPDATE_SPEED_MS = 1000 * 60; // one per minute

const debouncedMarketsData = createHookedSelector(
  // argument is just to cause this to rerender when the markets change, we don't use that value
  [(state) => state.perpetuals.markets],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (_marketsToIgnore) => {
    const markets = abacusStateManager.stateManager.state?.marketsSummary?.markets;
    const latestMarkets = hookifyHooks.useRef(markets);

    // wrap in object because the stupud abacus value isn't a new reference when data is new for some reason
    const [marketsToReturn, setMarketsToReturn] = hookifyHooks.useState<{
      data: kollections.Map<string, PerpetualMarket> | undefined;
    }>({ data: undefined });

    const throttledSync = hookifyHooks.useMemo(
      () =>
        throttle(() => {
          setMarketsToReturn({
            data: latestMarkets.current ?? undefined,
          });
        }, MAX_UPDATE_SPEED_MS),
      []
    );

    latestMarkets.current = markets;
    throttledSync();

    // if markets is null and we have non-null, force set it
    if (marketsToReturn.data == null || marketsToReturn.data.size === 0) {
      if (latestMarkets.current != null && latestMarkets.current.size > 0) {
        setMarketsToReturn((state) => {
          // if it got set by someone else, don't bother
          if (state.data == null || state.data.size === 0) {
            return { data: latestMarkets.current ?? undefined };
          }
          return state;
        });
      }
    }

    return marketsToReturn;
  }
);

// it's illegal to return undefined from use query so we just wrap results in a data object
function wrapNullable<T>(data: T | undefined | null): { data: T | null | undefined } {
  return { data };
}

export const loadedVaultPositions = createHookedSelector(
  [debouncedMarketsData],
  (marketsMapRaw) => {
    const marketsMap = marketsMapRaw.data;
    const { data: subvaultHistories } = useQueryHf({
      queryKey: ['subvaultHistories'],
      queryFn: async () => {
        return wrapNullable(
          VaultCalculator.getSubvaultHistoricalPnlResponse(await placeholderFetchSubvaultHistory())
        );
      },
      ...vaultQueryOptions,
    });

    const { data: vaultPositions } = useQueryHf({
      queryKey: ['vaultPositions'],
      queryFn: async () => {
        return wrapNullable(
          VaultCalculator.getVaultPositionsResponse(await placeholderFetchMegavaultPositions())
        );
      },
      ...vaultQueryOptions,
    });

    const calculatedPositions = hookifyHooks.useMemo(() => {
      if (
        vaultPositions?.data == null ||
        subvaultHistories?.data == null ||
        marketsMap == null ||
        marketsMap.size === 0
      ) {
        return undefined;
      }
      return VaultCalculator.calculateVaultPositions(
        vaultPositions.data,
        subvaultHistories.data,
        marketsMap
      );
    }, [subvaultHistories, vaultPositions, marketsMap]);

    return calculatedPositions;
  }
).dispatchValue((dispatch, value) => {
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
        return wrapNullable(undefined);
      }
      return wrapNullable(
        VaultAccountCalculator.calculateUserVaultInfo(parsedAccount, parsedTransfers)
      );
    },
    ...vaultQueryOptions,
  });
  return accountVault?.data;
}).dispatchValue((dispatch, value) => {
  dispatch(setVaultAccount(value));
});

function useDebounceHf<T>(value: T, delayMs?: number): T {
  const [debouncedValue, setDebouncedValue] = hookifyHooks.useState<T>(value);

  hookifyHooks.useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs ?? 500);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debouncedValue;
}

const vaultFormAmountDebounced = createHookedSelector(
  [(state) => state.vaults.vaultForm.amount],
  (amount) => {
    return useDebounceHf(amount, 500);
  }
);

export const vaultFormSlippage = createHookedSelector(
  [
    vaultFormAmountDebounced,
    (state) => state.vaults.vaultForm.operation,
    (state) => state.vaults.vaultAccount,
  ],
  (amount, operation, vaultBalance) => {
    const { data: slippageResp } = useQueryHf({
      queryKey: ['vaultSlippage', amount, operation],
      queryFn: async () => {
        if (operation === 'DEPOSIT' || amount.trim() === '') {
          return wrapNullable(undefined);
        }
        const sharesToWithdraw = MustBigNumber(amount).div(
          // usdc / share to determine share value
          MustBigNumber(vaultBalance?.balanceUsdc).div(MustBigNumber(vaultBalance?.balanceShares))
        );
        const slippage = await placeholderFetchVaultFormSlippage(
          sharesToWithdraw.decimalPlaces(0, BigNumber.ROUND_FLOOR).toNumber(),
          MustBigNumber(amount).times(0.96145).toNumber()
        );

        const parsedSlippage =
          VaultDepositWithdrawFormValidator.getVaultDepositWithdrawSlippageResponse(slippage);

        return wrapNullable(parsedSlippage);
      },
      ...vaultQueryOptions,
    });
    return slippageResp?.data;
  }
).dispatchValue((dispatch, value) => {
  dispatch(setVaultFormSlippageResponse(value ?? undefined));
});

export const vaultFormValidation = createHookedSelector(
  [
    vaultFormAmountDebounced,
    createAppSelector(
      [
        (state) => state.vaults.vaultForm.operation,
        (state) => state.vaults.vaultForm.slippageAck,
        (state) => state.vaults.vaultForm.confirmationStep,
        (state) => state.vaults.vaultForm.slippageResponse,
      ],
      (operation, slippageAck, confirmationStep, slippageResponse) => ({
        operation,
        slippageAck,
        confirmationStep,
        slippageResponse,
      })
    ),
    (state) => state.vaults.vaultAccount,
    createAppSelector(
      [
        (state) => state.account.subaccount?.marginUsage?.current,
        (state) => state.account.subaccount?.freeCollateral?.current,
      ],
      (marginUsage, freeCollateral) => ({
        marginUsage,
        freeCollateral,
      })
    ),
  ],
  (
    amount,
    { operation, slippageAck, confirmationStep, slippageResponse },
    vaultAccount,
    accountInfo
  ) => {
    const { data: validationResponse } = useQueryHf({
      queryKey: [
        'vaultFormValidation',
        amount,
        operation,
        slippageAck,
        confirmationStep,
        slippageResponse?.toString(),
        vaultAccount?.toString(),
        accountInfo,
      ],
      queryFn: async () => {
        const parsedSlippage = VaultDepositWithdrawFormValidator.validateVaultForm(
          new VaultFormData(
            operation === 'DEPOSIT'
              ? VaultFormAction.DEPOSIT
              : operation === 'WITHDRAW'
                ? VaultFormAction.WITHDRAW
                : assertNever(operation),
            amount != null ? MustBigNumber(amount).toNumber() : undefined,
            slippageAck,
            confirmationStep
          ),
          new VaultFormAccountData(accountInfo.marginUsage, accountInfo.freeCollateral),
          vaultAccount,
          slippageResponse
        );

        return wrapNullable(parsedSlippage);
      },
      ...vaultQueryOptions,
    });
    return validationResponse?.data;
  }
).dispatchValue((dispatch, value) => {
  dispatch(setVaultFormValidationResponse(value ?? undefined));
});
