import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { kollections } from '@dydxprotocol/v4-abacus';
import { MEGAVAULT_MODULE_ADDRESS, PnlTickInterval } from '@dydxprotocol/v4-client-js';
import { UseQueryResult, useQuery } from '@tanstack/react-query';
import { throttle } from 'lodash';

import {
  IndexerMegavaultHistoricalPnlResponse,
  Nullable,
  PerpetualMarket,
  VaultAccountCalculator,
  VaultCalculator,
  VaultDepositWithdrawFormValidator,
  VaultFormAccountData,
  VaultFormAction,
  VaultFormData,
} from '@/constants/abacus';
import { AnalyticsEvents } from '@/constants/analytics';
import { STRING_KEYS, StringGetterFunction } from '@/constants/localization';
import { timeUnits } from '@/constants/time';

import { selectSubaccountStateForVaults } from '@/state/accountCalculators';
import { getVaultForm, selectVaultFormStateExceptAmount } from '@/state/vaultSelectors';

import abacusStateManager from '@/lib/abacus';
import { track } from '@/lib/analytics/analytics';
import { assertNever } from '@/lib/assertNever';
import { MustBigNumber } from '@/lib/numbers';
import { safeStringifyForAbacusParsing } from '@/lib/stringifyHelpers';

import { appQueryClient } from '../state/appQueryClient';
import { useAppSelector } from '../state/appTypes';
import { useAccounts } from './useAccounts';
import { useDebounce } from './useDebounce';
import { useDydxClient } from './useDydxClient';
import { useStringGetter } from './useStringGetter';
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
  staleTime: timeUnits.minute / 4,
  refetchInterval: timeUnits.minute / 3,
};

export function useForceRefreshVaultDetails() {
  return useCallback(
    () =>
      appQueryClient.invalidateQueries({
        queryKey: ['vaultDetails'],
      }),
    []
  );
}

const toProcessedHistoricalPnlResponse = (res: any) =>
  VaultCalculator.getVaultHistoricalPnlResponse(safeStringifyForAbacusParsing(res));

export const useLoadedVaultDetails = () => {
  const { getMegavaultHistoricalPnl } = useDydxClient();
  const vaultDetailsResult = useQuery({
    queryKey: ['vaultDetails'],
    queryFn: async () => {
      const [dailyResult, hourlyResult] = await Promise.all([
        getMegavaultHistoricalPnl(PnlTickInterval.day).then(toProcessedHistoricalPnlResponse),
        getMegavaultHistoricalPnl(PnlTickInterval.HOUR).then(toProcessedHistoricalPnlResponse),
      ]);
      return wrapNullable(
        VaultCalculator.calculateVaultSummary(
          new IndexerMegavaultHistoricalPnlResponse([
            ...(dailyResult?.megavaultPnl ?? []),
            ...(hourlyResult?.megavaultPnl ?? []),
          ])
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
    data: latestMarkets.current?.size ? latestMarkets.current : undefined,
  });

  const throttledSync = useMemo(
    () =>
      throttle(() => {
        setMarketsToReturn({
          data: latestMarkets.current?.size ? latestMarkets.current : undefined,
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
  if (!marketsToReturn.data?.size) {
    if (latestMarkets.current?.size) {
      setMarketsToReturn((prev) => {
        // if it got set by someone else, don't bother
        if (!prev.data?.size) {
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
          safeStringifyForAbacusParsing(await getVaultsHistoricalPnl())
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
          safeStringifyForAbacusParsing(await getMegavaultPositions())
        )
      );
    },
    ...vaultQueryOptions,
  });

  const vaultTvl = useLoadedVaultDetails().data?.totalValue;

  const calculatedPositions = useMemo(() => {
    if (vaultPositions?.data == null || marketsMap.data == null || marketsMap.data.size === 0) {
      return undefined;
    }
    return VaultCalculator.calculateVaultPositions(
      vaultPositions.data,
      subvaultHistories?.data,
      marketsMap.data,
      vaultTvl
    );
  }, [vaultPositions?.data, marketsMap.data, subvaultHistories?.data, vaultTvl]);

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
  const { getAllAccountTransfersBetween, compositeClient } = useDydxClient();
  const { dydxAddress } = useAccounts();
  const { getVaultAccountInfo } = useSubaccount();

  const accountVaultQueryResult = useQuery({
    queryKey: ['vaultAccount', dydxAddress, compositeClient != null],
    queryFn: async () => {
      if (dydxAddress == null || compositeClient == null) {
        return wrapNullable(undefined);
      }
      const [acc, transfers] = await Promise.all([
        getVaultAccountInfo().then(
          (a) => a,
          // error is an expected result of this call when user has no balance
          () => undefined
        ),
        getAllAccountTransfersBetween(dydxAddress, '0', MEGAVAULT_MODULE_ADDRESS, '0'),
      ]);

      const parsedAccount = VaultAccountCalculator.getAccountVaultResponse(
        safeStringifyForAbacusParsing(acc)
      );
      const parsedTransfers = VaultAccountCalculator.getTransfersBetweenResponse(
        safeStringifyForAbacusParsing(transfers)
      );

      if (parsedTransfers == null) {
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

const VAULT_FORM_AMOUNT_DEBOUNCE_MS = 500;
const useVaultFormAmountDebounced = () => {
  const amount = useAppSelector((state) => state.vaults.vaultForm.amount);
  const debouncedAmount = useDebounce(amount, VAULT_FORM_AMOUNT_DEBOUNCE_MS);

  useEffect(() => {
    if (MustBigNumber(debouncedAmount).gt(0)) {
      track(AnalyticsEvents.EnterValidVaultAmountForm());
    }
  }, [debouncedAmount]);

  // if the user goes back to the beginning, use that value for calculations
  // this fixes an issue where the validation logic would show an error for a second after submission
  // when we reset the value
  if (amount === '') {
    return amount;
  }

  return debouncedAmount;
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
      const sharesToWithdraw = VaultDepositWithdrawFormValidator.calculateSharesToWithdraw(
        vaultBalance,
        MustBigNumber(amount).toNumber()
      );
      const slippage = await getVaultWithdrawInfo(sharesToWithdraw);

      const parsedSlippage =
        VaultDepositWithdrawFormValidator.getVaultDepositWithdrawSlippageResponse(
          safeStringifyForAbacusParsing(slippage)
        );

      return wrapNullable(parsedSlippage);
    },
    ...vaultQueryOptions,
  });
  return mapNullableQueryResult(slippageQueryResult);
};

export const useVaultFormValidationResponse = () => {
  const { operation, slippageAck, termsAck, confirmationStep } = useAppSelector(
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
        termsAck,
        confirmationStep
      ),
    [operation, amount, slippageAck, termsAck, confirmationStep]
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

const TIME_TO_SHOW_ERROR = timeUnits.minute * 1;

function getErrorToRenderFromErrorMessage(
  errorMessage: string,
  stringGetter: StringGetterFunction
): string {
  if (errorMessage.indexOf('insufficient funds: insufficient funds') > 0) {
    return stringGetter({ key: STRING_KEYS.BROADCAST_ERROR_SDK_5 });
  }
  return errorMessage.split('\n')[0];
}

export const useVaultFormErrorState = () => {
  const { amount, confirmationStep, operation } = useAppSelector(getVaultForm) ?? {};
  const stringGetter = useStringGetter();
  const [savedErrorMessage, setSavedErrorMessage] = useState<string | undefined>(undefined);
  const currentTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

  const handleErrorResponse = (error: any) => {
    clearTimeout(currentTimeout.current);
    setSavedErrorMessage(error.message);
    currentTimeout.current = setTimeout(() => {
      setSavedErrorMessage(undefined);
    }, TIME_TO_SHOW_ERROR);
  };

  // reset on form change
  useEffect(() => {
    setSavedErrorMessage(undefined);
  }, [amount, confirmationStep, operation]);
  // clear on unmount too
  useEffect(() => clearTimeout(currentTimeout.current), []);

  const savedError = useMemo(
    () =>
      savedErrorMessage
        ? getErrorToRenderFromErrorMessage(savedErrorMessage, stringGetter)
        : undefined,
    [savedErrorMessage, stringGetter]
  );

  return [savedError, handleErrorResponse] as const;
};

function operationStringToVaultFormAction(operation: 'DEPOSIT' | 'WITHDRAW') {
  return operation === 'DEPOSIT'
    ? VaultFormAction.DEPOSIT
    : operation === 'WITHDRAW'
      ? VaultFormAction.WITHDRAW
      : assertNever(operation);
}
