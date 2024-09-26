import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { kollections } from '@dydxprotocol/v4-abacus';
import { MEGAVAULT_MODULE_ADDRESS } from '@dydxprotocol/v4-client-js';
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
import { useAccounts } from './useAccounts';
import { useDebounce } from './useDebounce';
import { useDydxClient } from './useDydxClient';
import { useSubaccount } from './useSubaccount';

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

function safeStringifyForAbacus(arg: any): string {
  if (arg == null) {
    return '';
  }
  return JSON.stringify(arg);
}

export function useForceRefreshVaultDetails() {
  return useCallback(
    () =>
      appQueryClient.invalidateQueries({
        queryKey: ['vaultDetails'],
      }),
    []
  );
}

export const useLoadedVaultDetails = () => {
  const { getMegavaultHistoricalPnl } = useDydxClient();
  const vaultDetailsResult = useQuery({
    queryKey: ['vaultDetails'],
    queryFn: async () => {
      const callResult = await getMegavaultHistoricalPnl();
      return wrapNullable(
        VaultCalculator.calculateVaultSummary(
          VaultCalculator.getVaultHistoricalPnlResponse(safeStringifyForAbacus(callResult))
        )
      );
    },
    ...vaultQueryOptions,
  });
  return mapNullableQueryResult(vaultDetailsResult);
};

export const useVaultPnlHistory = () => {
  const details = useLoadedVaultDetails();
  return useMemo(() => details.data?.history?.toArray().reverse(), [details.data?.history]);
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
  }>({
    data:
      latestMarkets.current != null && latestMarkets.current.size > 0
        ? latestMarkets.current
        : undefined,
  });

  const throttledSync = useMemo(
    () =>
      throttle(() => {
        setMarketsToReturn({
          data:
            latestMarkets.current != null && latestMarkets.current.size > 0
              ? latestMarkets.current
              : undefined,
        });
      }, MAX_UPDATE_SPEED_MS),
    []
  );

  // update once per minute
  // this useEffect is meant to run basically every render
  useEffect(() => {
    throttledSync();
  }, [_marketsOnlyHereToTriggerRerenders, throttledSync]);

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
  const { getVaultsHistoricalPnl, getMegavaultPositions } = useDydxClient();
  const marketsMap = useDebouncedMarketsData();
  const { data: subvaultHistories } = useQuery({
    queryKey: ['subvaultHistories'],
    queryFn: async () => {
      return wrapNullable(
        VaultCalculator.getSubvaultHistoricalPnlResponse(
          safeStringifyForAbacus(await getVaultsHistoricalPnl())
        )
      );
    },
    ...vaultQueryOptions,
  });

  const { data: vaultPositions } = useQuery({
    queryKey: ['vaultPositions'],
    queryFn: async () => {
      return wrapNullable(
        VaultCalculator.getVaultPositionsResponse(
          safeStringifyForAbacus(await getMegavaultPositions())
        )
      );
    },
    ...vaultQueryOptions,
    refetchInterval: timeUnits.second * 15,
  });

  const calculatedPositions = useMemo(() => {
    if (vaultPositions?.data == null || marketsMap.data == null || marketsMap.data.size === 0) {
      return undefined;
    }
    return VaultCalculator.calculateVaultPositions(
      vaultPositions.data,
      subvaultHistories?.data,
      marketsMap.data
    );
  }, [subvaultHistories, vaultPositions, marketsMap]);

  return calculatedPositions;
};

export function useForceRefreshVaultAccount() {
  return useCallback(
    () =>
      appQueryClient.invalidateQueries({
        queryKey: ['vaultAccount'],
      }),
    []
  );
}

export const useLoadedVaultAccount = () => {
  const { getAllAccountTransfersBetween } = useDydxClient();
  const { dydxAddress } = useAccounts();
  const { getVaultAccountInfo } = useSubaccount();
  const { compositeClient } = useDydxClient();

  const accountVaultQueryResult = useQuery({
    queryKey: ['vaultAccount', dydxAddress, compositeClient != null],
    queryFn: async () => {
      if (dydxAddress == null || compositeClient == null) {
        return wrapNullable(undefined);
      }
      const [acc, transfers] = await Promise.all([
        getVaultAccountInfo(),
        getAllAccountTransfersBetween(dydxAddress, '0', MEGAVAULT_MODULE_ADDRESS, '0'),
      ]);

      const parsedAccount = VaultAccountCalculator.getAccountVaultResponse(
        safeStringifyForAbacus(acc)
      );
      const parsedTransfers = VaultAccountCalculator.getTransfersBetweenResponse(
        safeStringifyForAbacus(transfers)
      );

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
  return useDebounce(amount, 500);
};

export const useVaultFormSlippage = () => {
  const amount = useVaultFormAmountDebounced();
  const operation = useAppSelector((state) => state.vaults.vaultForm.operation);
  const vaultBalance = useLoadedVaultAccount().data;
  const { getVaultWithdrawInfo } = useDydxClient();
  const { compositeClient } = useDydxClient();

  const slippageQueryResult = useQuery({
    queryKey: [
      'vaultSlippage',
      amount,
      operation,
      vaultBalance?.balanceUsdc,
      vaultBalance?.balanceShares,
      compositeClient != null,
    ],
    queryFn: async () => {
      if (operation === 'DEPOSIT' || amount.trim() === '') {
        return wrapNullable(undefined);
      }
      const sharesToWithdraw = MustBigNumber(amount).div(
        // usdc / share to determine share value
        MustBigNumber(vaultBalance?.balanceUsdc).div(MustBigNumber(vaultBalance?.balanceShares))
      );
      const slippage = await getVaultWithdrawInfo(
        sharesToWithdraw.decimalPlaces(0, BigNumber.ROUND_FLOOR).toNumber()
      );

      const parsedSlippage =
        VaultDepositWithdrawFormValidator.getVaultDepositWithdrawSlippageResponse(
          safeStringifyForAbacus(slippage)
        );

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
