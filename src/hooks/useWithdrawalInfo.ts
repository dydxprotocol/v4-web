import { useEffect, useMemo } from 'react';
import { useQuery } from 'react-query';
import BigNumber from 'bignumber.js';
import { encodeJson } from '@dydxprotocol/v4-client-js';
import { ByteArrayEncoding } from '@dydxprotocol/v4-client-js/build/src/lib/helpers';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';

import { DialogTypes } from '@/constants/dialogs';
import { isMainnet } from '@/constants/networks';
import { useEnvFeatures } from './useEnvFeatures';

import { getApiState } from '@/state/appSelectors';
import { closeDialog, openDialog } from '@/state/dialogs';
import { getSelectedLocale } from '@/state/localizationSelectors';

import { formatRelativeTime } from '@/lib/dateTime';
import { BIG_NUMBERS, MustBigNumber } from '@/lib/numbers';
import { log } from '@/lib/telemetry';

import { useDydxClient } from './useDydxClient';
import { useTokenConfigs } from './useTokenConfigs';

const BLOCK_TIME = isMainnet ? 1_000 : 1_500;

export const useWithdrawalInfo = ({
  transferType,
}: {
  transferType: 'withdrawal' | 'transfer';
}) => {
  const { getWithdrawalAndTransferGatingStatus, getWithdrawalCapacityByDenom } = useDydxClient();
  const { usdcDenom, usdcDecimals } = useTokenConfigs();
  const apiState = useSelector(getApiState, shallowEqual);
  const { height } = apiState || {};
  const selectedLocale = useSelector(getSelectedLocale);
  const dispatch = useDispatch();
  const { withdrawalSafetyEnabled } = useEnvFeatures();

  const { data: usdcWithdrawalCapacity } = useQuery({
    enabled: withdrawalSafetyEnabled,
    queryKey: 'usdcWithdrawalCapacity',
    queryFn: async () => {
      try {
        const response = await getWithdrawalCapacityByDenom({ denom: usdcDenom });
        return JSON.parse(encodeJson(response, ByteArrayEncoding.BIGINT));
      } catch (error) {
        log('useWithdrawalInfo/getWithdrawalCapacityByDenom', error);
      }
    },
    refetchInterval: 60_000,
    staleTime: 60_000,
  });

  const { data: withdrawalAndTransferGatingStatus } = useQuery({
    enabled: withdrawalSafetyEnabled,
    queryKey: 'withdrawalTransferGateStatus',
    queryFn: async () => {
      try {
        return await getWithdrawalAndTransferGatingStatus();
      } catch (error) {
        log('useWithdrawalInfo/getWithdrawalAndTransferGatingStatus', error);
      }
    },
    refetchInterval: 60_000,
    staleTime: 60_000,
  });

  const capacity = useMemo(() => {
    const capacityList = usdcWithdrawalCapacity?.limiterCapacityList;
    if (!capacityList || capacityList.length < 2) {
      if (!withdrawalSafetyEnabled) {
        return BigNumber(Infinity);
      }

      return BIG_NUMBERS.ZERO;
    }

    const [{ capacity: daily }, { capacity: weekly }] = capacityList;
    const dailyBN = MustBigNumber(daily);
    const weeklyBN = MustBigNumber(weekly);
    return BigNumber.minimum(dailyBN, weeklyBN).div(10 ** usdcDecimals);
  }, [usdcDecimals, usdcWithdrawalCapacity]);

  const withdrawalAndTransferGatingStatusValue = useMemo(() => {
    const { withdrawalsAndTransfersUnblockedAtBlock } = withdrawalAndTransferGatingStatus ?? {};
    if (
      height &&
      withdrawalsAndTransfersUnblockedAtBlock &&
      height < withdrawalsAndTransfersUnblockedAtBlock &&
      withdrawalSafetyEnabled
    ) {
      return {
        estimatedUnblockTime: formatRelativeTime(
          Date.now() + (withdrawalsAndTransfersUnblockedAtBlock - height) * BLOCK_TIME,
          {
            locale: selectedLocale,
            largestUnit: 'day',
          }
        ),
        isGated: true,
      };
    }
    return {
      estimatedUnblockTime: null,
      isGated: false,
    };
  }, [height, withdrawalAndTransferGatingStatus, withdrawalSafetyEnabled]);

  useEffect(() => {
    if (
      withdrawalAndTransferGatingStatusValue.isGated &&
      withdrawalAndTransferGatingStatusValue.estimatedUnblockTime &&
      withdrawalSafetyEnabled
    ) {
      dispatch(closeDialog());
      dispatch(
        openDialog({
          type: DialogTypes.WithdrawalGated,
          dialogProps: {
            transferType,
            estimatedUnblockTime: withdrawalAndTransferGatingStatusValue.estimatedUnblockTime,
          },
        })
      );
    }
  }, [transferType, withdrawalAndTransferGatingStatusValue.isGated, withdrawalSafetyEnabled]);

  return {
    usdcWithdrawalCapacity: capacity,
    withdrawalAndTransferGatingStatus,
  };
};
