import { useEffect, useMemo, useRef, useState } from 'react';

import { kollections } from '@dydxprotocol/v4-abacus';
import { UseQueryResult, useQuery } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';
import { throttle } from 'lodash';

import {
  Nullable,
  PerpetualMarket,
  VaultAccountCalculator,
  VaultCalculator,
  VaultDepositWithdrawFormValidator,
  VaultFormAccountData,
  VaultFormAction,
  VaultFormData,
} from '@/constants/abacus';
import { timeUnits } from '@/constants/time';

import { selectSubaccountStateForVaults } from '@/state/accountCalculators';
import { selectVaultFormStateExceptAmount } from '@/state/vaultSelectors';

import abacusStateManager from '@/lib/abacus';
import { assertNever } from '@/lib/assertNever';
import { MustBigNumber } from '@/lib/numbers';

import { appQueryClient } from '../state/appQueryClient';
import { useAppSelector } from '../state/appTypes';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function placeholderFetchMegavaultHistory() {
  await delay(Math.random() * 2000);

  const baseObj = {
    megavaultPnl: [
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
        ticker: 'BTC-USD',
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
        ticker: 'BTC-USD',
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

function useDebounceHf<T>(value: T, delayMs?: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs ?? 500);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debouncedValue;
}

// it's illegal to return undefined from use query so we just wrap results in a data object
function wrapNullable<T>(data: T | undefined | null): { data: T | null | undefined } {
  return { data };
}

function mapNullableQueryResult<T>(
  res: Omit<UseQueryResult<{ data: T }>, 'refetch'>
): Omit<UseQueryResult<T | undefined>, 'refetch'> {
  return { ...res, data: res.data?.data };
}

const vaultQueryOptions = {
  staleTime: timeUnits.minute,
  refetchInterval: timeUnits.minute * 2,
};

export const useLoadedVaultDetails = () => {
  const vaultDetailsResult = useQuery({
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
  return mapNullableQueryResult(vaultDetailsResult);
};

export const useVaultPnlHistory = () => {
  const details = useLoadedVaultDetails();
  return useMemo(() => details.data?.history?.toArray(), [details.data?.history]);
};

const MAX_UPDATE_SPEED_MS = timeUnits.minute;

// A reference to raw abacus markets map that updates only when the data goes from empty to full and once per minute
// Note that this will cause the component to re-render a lot since we have to subscribe to redux markets which changes often
// I don't know how else to ensure we catch the 0->1 aka empty to filled update
const useDebouncedMarketsData = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/naming-convention
  const _marketsOnlyHereToTriggerRerenders = useAppSelector((state) => state.perpetuals.markets);

  const markets = abacusStateManager.stateManager.state?.marketsSummary?.markets;
  const latestMarkets = useRef(markets);
  latestMarkets.current = markets;

  // wrap in object because the stupud abacus value isn't a new reference when data is new for some reason
  const [marketsToReturn, setMarketsToReturn] = useState<{
    data: Nullable<kollections.Map<string, PerpetualMarket>>;
  }>({ data: latestMarkets.current });

  const throttledSync = useMemo(
    () =>
      throttle(() => {
        setMarketsToReturn({
          data: latestMarkets.current,
        });
      }, MAX_UPDATE_SPEED_MS),
    []
  );

  // update once per minute
  throttledSync();

  // if markets is null and we have non-null, force update it
  if (marketsToReturn.data == null || marketsToReturn.data.size === 0) {
    if (latestMarkets.current != null && latestMarkets.current.size > 0) {
      setMarketsToReturn((prev) => {
        // if it got set by someone else, don't bother
        if (prev.data == null || prev.data.size === 0) {
          return { data: latestMarkets.current };
        }
        return prev;
      });
    }
  }

  return marketsToReturn;
};

export const useLoadedVaultPositions = () => {
  const marketsMap = useDebouncedMarketsData().data;
  const { data: subvaultHistories } = useQuery({
    queryKey: ['subvaultHistories'],
    queryFn: async () => {
      return wrapNullable(
        VaultCalculator.getSubvaultHistoricalPnlResponse(await placeholderFetchSubvaultHistory())
      );
    },
    ...vaultQueryOptions,
  });

  const { data: vaultPositions } = useQuery({
    queryKey: ['vaultPositions'],
    queryFn: async () => {
      return wrapNullable(
        VaultCalculator.getVaultPositionsResponse(await placeholderFetchMegavaultPositions())
      );
    },
    ...vaultQueryOptions,
  });

  const calculatedPositions = useMemo(() => {
    if (vaultPositions?.data == null || marketsMap == null || marketsMap.size === 0) {
      return undefined;
    }
    return VaultCalculator.calculateVaultPositions(
      vaultPositions.data,
      subvaultHistories?.data,
      marketsMap
    );
  }, [subvaultHistories, vaultPositions, marketsMap]);

  return calculatedPositions;
};

const vaultAccountQueryKey = ['vaultAccount'];

export function forceRefreshVaultAccount() {
  appQueryClient.invalidateQueries({ queryKey: vaultAccountQueryKey, exact: true });
}

export const useLoadedVaultAccount = () => {
  const accountVaultQueryResult = useQuery({
    queryKey: vaultAccountQueryKey,
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
  return mapNullableQueryResult(accountVaultQueryResult);
};

export const useLoadedVaultAccountTransfers = () => {
  const account = useLoadedVaultAccount();
  return useMemo(() => account.data?.vaultTransfers?.toArray(), [account.data?.vaultTransfers]);
};

const useVaultFormAmountDebounced = () => {
  const amount = useAppSelector((state) => state.vaults.vaultForm.amount);
  return useDebounceHf(amount, 500);
};

export const useVaultFormSlippage = () => {
  const amount = useVaultFormAmountDebounced();
  const operation = useAppSelector((state) => state.vaults.vaultForm.operation);
  const vaultBalance = useLoadedVaultAccount().data;

  const slippageQueryResult = useQuery({
    queryKey: [
      'vaultSlippage',
      amount,
      operation,
      vaultBalance?.balanceUsdc,
      vaultBalance?.balanceShares,
    ],
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
  return mapNullableQueryResult(slippageQueryResult);
};

export const useVaultFormValidationResponse = () => {
  const { operation, slippageAck, confirmationStep } = useAppSelector(
    selectVaultFormStateExceptAmount
  );
  const accountInfo = useAppSelector(selectSubaccountStateForVaults);
  const amount = useVaultFormAmountDebounced();
  const slippageResponse = useVaultFormSlippage().data;
  const vaultAccount = useLoadedVaultAccount().data;

  const vaultFormInfo = useMemo(
    () =>
      new VaultFormData(
        operationStringToVaultFormAction(operation),
        amount != null && amount.trim().length > 0 ? MustBigNumber(amount).toNumber() : undefined,
        slippageAck,
        confirmationStep
      ),
    [operation, amount, slippageAck, confirmationStep]
  );
  const vaultFormAccountInfo = useMemo(
    () =>
      new VaultFormAccountData(
        accountInfo.marginUsage,
        accountInfo.freeCollateral,
        accountInfo.canViewAccount
      ),
    [accountInfo.marginUsage, accountInfo.freeCollateral, accountInfo.canViewAccount]
  );
  const validationResponse = useMemo(
    () =>
      VaultDepositWithdrawFormValidator.validateVaultForm(
        vaultFormInfo,
        vaultFormAccountInfo,
        vaultAccount,
        slippageResponse
      ),
    [vaultFormInfo, vaultFormAccountInfo, vaultAccount, slippageResponse]
  );

  return validationResponse;
};

function operationStringToVaultFormAction(operation: 'DEPOSIT' | 'WITHDRAW') {
  return operation === 'DEPOSIT'
    ? VaultFormAction.DEPOSIT
    : operation === 'WITHDRAW'
      ? VaultFormAction.WITHDRAW
      : assertNever(operation);
}
