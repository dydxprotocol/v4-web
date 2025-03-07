import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { calculateVaultPositions, calculateVaultSummary } from '@/bonsai/public-calculators/vault';
import { calculateUserVaultInfo } from '@/bonsai/public-calculators/vaultAccount';
import {
  calculateSharesToWithdraw,
  validateVaultForm,
  VaultFormAction,
  VaultFormData,
} from '@/bonsai/public-calculators/vaultFormValidation';
// we need this because vaults table sometimes has rows which we can't render but do have balance
// eslint-disable-next-line no-restricted-imports
import { selectAllMarketsInfo } from '@/bonsai/selectors/markets';
import { MarketsInfo } from '@/bonsai/types/summaryTypes';
import { MEGAVAULT_MODULE_ADDRESS, PnlTickInterval } from '@dydxprotocol/v4-client-js';
import { useQuery } from '@tanstack/react-query';
import { throttle } from 'lodash';

import { AnalyticsEvents } from '@/constants/analytics';
import { STRING_KEYS, StringGetterFunction } from '@/constants/localization';
import { timeUnits } from '@/constants/time';

import { selectSubaccountStateForVaults } from '@/state/accountCalculators';
import { getVaultForm, selectVaultFormStateExceptAmount } from '@/state/vaultSelectors';

import { track } from '@/lib/analytics/analytics';
import { assertNever } from '@/lib/assertNever';
import { mapNullableQueryResult, wrapNullable } from '@/lib/asyncUtils';
import { mapIfPresent } from '@/lib/do';
import { isTruthy } from '@/lib/isTruthy';
import { MustBigNumber } from '@/lib/numbers';
import { isPresent } from '@/lib/typeUtils';

import { appQueryClient } from '../state/appQueryClient';
import { useAppSelector } from '../state/appTypes';
import { useAccounts } from './useAccounts';
import { useDebounce } from './useDebounce';
import { useDydxClient } from './useDydxClient';
import { useEnvConfig } from './useEnvConfig';
import { useStringGetter } from './useStringGetter';
import { useSubaccount } from './useSubaccount';

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

export const useLoadedVaultDetails = () => {
  const { getMegavaultHistoricalPnl } = useDydxClient();
  const megavaultHistoryStartDateMs = useEnvConfig('megavaultHistoryStartDateMs');

  const vaultDetailsResult = useQuery({
    queryKey: ['vaultDetails'],
    queryFn: async () => {
      const [dailyResult, hourlyResult] = await Promise.all([
        getMegavaultHistoricalPnl(PnlTickInterval.day),
        getMegavaultHistoricalPnl(PnlTickInterval.HOUR),
      ]);
      return wrapNullable(
        calculateVaultSummary(
          [dailyResult, hourlyResult].filter(isPresent),
          isTruthy(megavaultHistoryStartDateMs)
            ? MustBigNumber(megavaultHistoryStartDateMs).toNumber()
            : 0
        )
      );
    },
    ...vaultQueryOptions,
  });
  return mapNullableQueryResult(vaultDetailsResult);
};

export const useVaultPnlHistory = () => {
  const details = useLoadedVaultDetails();
  return useMemo(
    () => mapIfPresent(details.data?.history, (h) => [...h].reverse()),
    [details.data?.history]
  );
};

const MAX_UPDATE_SPEED_MS = timeUnits.minute;

function isValidMarkets(markets: MarketsInfo | undefined) {
  return Object.keys(markets ?? {}).length > 0;
}
// A reference to raw markets data that updates only when the data goes from empty to full and once per minute
// Note that this will cause the component to re-render a lot since we have to subscribe to redux markets which changes often
// I don't know how else to ensure we catch the 0->1 aka empty to filled update
const useDebouncedMarketsData = () => {
  // ignore this value except as the source of our ref
  // We have to use the markets INFO selector which is hidden from bonsai ontology because we need accurate oracle prices for
  // hidden markets
  const marketsForUpdates = useAppSelector(selectAllMarketsInfo);
  const latestMarkets = useRef(marketsForUpdates);
  latestMarkets.current = marketsForUpdates;

  // wrap in object because the value isn't a new reference when data is new for some reason
  const [marketsToReturn, setMarketsToReturn] = useState<{
    data: MarketsInfo | undefined;
  }>({
    data: isValidMarkets(latestMarkets.current) ? latestMarkets.current : undefined,
  });

  const throttledSync = useMemo(
    () =>
      throttle(() => {
        setMarketsToReturn({
          data: isValidMarkets(latestMarkets.current) ? latestMarkets.current : undefined,
        });
      }, MAX_UPDATE_SPEED_MS),
    []
  );

  // update once per minute
  // this useEffect is meant to run basically every render
  useEffect(() => {
    throttledSync();
  }, [marketsForUpdates, throttledSync]);

  // if markets is null and we have non-null, force update it
  if (!isValidMarkets(marketsToReturn.data)) {
    if (isValidMarkets(latestMarkets.current)) {
      setMarketsToReturn((prev) => {
        // if it got set by someone else, don't bother
        if (!isValidMarkets(prev.data)) {
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
      return wrapNullable(await getVaultsHistoricalPnl());
    },
    ...vaultQueryOptions,
  });

  const { data: vaultPositions } = useQuery({
    queryKey: ['vaultPositions'],
    queryFn: async () => {
      return wrapNullable(await getMegavaultPositions());
    },
    ...vaultQueryOptions,
  });

  const vaultTvl = useLoadedVaultDetails().data?.totalValue;

  const calculatedPositions = useMemo(() => {
    if (
      vaultPositions?.data == null ||
      marketsMap.data == null ||
      !isValidMarkets(marketsMap.data)
    ) {
      return undefined;
    }
    return calculateVaultPositions(
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
      const [account, transfers] = await Promise.all([
        getVaultAccountInfo().then(
          (a) => a,
          // error is an expected result of this call when user has no balance
          () => undefined
        ),
        getAllAccountTransfersBetween(dydxAddress, '0', MEGAVAULT_MODULE_ADDRESS, '0'),
      ]);

      if (transfers == null) {
        return wrapNullable(undefined);
      }
      return wrapNullable(calculateUserVaultInfo(account, transfers));
    },
    ...vaultQueryOptions,
  });
  return mapNullableQueryResult(accountVaultQueryResult);
};

export const useLoadedVaultAccountTransfers = () => {
  const account = useLoadedVaultAccount();
  return useMemo(() => account.data?.vaultTransfers, [account.data?.vaultTransfers]);
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
      const sharesToWithdraw = calculateSharesToWithdraw(
        vaultBalance,
        MustBigNumber(amount).toNumber()
      );
      const slippage = await getVaultWithdrawInfo(sharesToWithdraw);

      return wrapNullable(slippage);
    },
    ...vaultQueryOptions,
  });
  return mapNullableQueryResult(slippageQueryResult);
};

export const useVaultCalculationForLaunchingMarket = ({ amount }: { amount: number }) => {
  const accountInfo = useAppSelector(selectSubaccountStateForVaults);
  const vaultAccount = useLoadedVaultAccount().data;

  const vaultFormInfo = useMemo(
    (): VaultFormData => ({
      action: VaultFormAction.DEPOSIT,
      amount,
      acknowledgedSlippage: true,
      acknowledgedTerms: true,
      inConfirmationStep: true,
    }),
    [amount]
  );

  const validationResponse = useMemo(
    () => validateVaultForm(vaultFormInfo, accountInfo, vaultAccount, undefined),
    [vaultAccount, vaultFormInfo, accountInfo]
  );

  return validationResponse;
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
    (): VaultFormData => ({
      action: operationStringToVaultFormAction(operation),
      amount: amount.trim().length > 0 ? MustBigNumber(amount).toNumber() : undefined,
      acknowledgedSlippage: slippageAck,
      acknowledgedTerms: termsAck,
      inConfirmationStep: confirmationStep,
    }),
    [operation, amount, slippageAck, termsAck, confirmationStep]
  );

  const validationResponse = useMemo(
    () => validateVaultForm(vaultFormInfo, accountInfo, vaultAccount, slippageResponse),
    [vaultFormInfo, accountInfo, vaultAccount, slippageResponse]
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
  return errorMessage.split('\n')[0]!;
}

export const useVaultFormErrorState = () => {
  const { amount, confirmationStep, operation } = useAppSelector(getVaultForm);
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
    : // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      operation === 'WITHDRAW'
      ? VaultFormAction.WITHDRAW
      : assertNever(operation);
}
