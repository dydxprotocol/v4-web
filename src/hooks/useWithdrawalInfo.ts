import { useQuery } from 'react-query';

import { useDydxClient } from './useDydxClient';
import { useTokenConfigs } from './useTokenConfigs';
import { encodeJson } from '@dydxprotocol/v4-client-js';
import { ByteArrayEncoding } from '@dydxprotocol/v4-client-js/build/src/lib/helpers';

export const useWithdrawalInfo = () => {
  const { getWithdrawalAndTransferGatingStatus, getWithdrawalCapacityByDenom } = useDydxClient();
  const { usdcDenom } = useTokenConfigs();

  const { data: usdcWithdawalCapacity } = useQuery({
    queryKey: 'usdcWithdrawalCapacity',
    queryFn: async () => {
      try {
        const response = await getWithdrawalCapacityByDenom({ denom: usdcDenom });
        return JSON.parse(encodeJson(response, ByteArrayEncoding.BIGINT));
      } catch (error) {
        console.error('error');
      }
    },
    refetchInterval: 60_000,
    staleTime: 60_000,
  });

  const { data: withdrawalAndTransferGatingStatus } = useQuery({
    queryKey: 'withdrawalTransferGateStatus',
    queryFn: getWithdrawalAndTransferGatingStatus,
    refetchInterval: 60_000,
    staleTime: 60_000,
  });

  return {
    usdcWithdawalCapacity,
    withdrawalAndTransferGatingStatus,
  };
};
