import { useCallback } from 'react';

import { useSignTypedData } from 'wagmi';

import { getSignTypedData } from '@/constants/wallets';

import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';

import { useEnvConfig } from './useEnvConfig';

export default function useSignForWalletDerivation() {
  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);
  const ethereumChainId = useEnvConfig('ethereumChainId');
  const chainId = Number(ethereumChainId);

  const signTypedData = getSignTypedData(selectedDydxChainId);
  const { signTypedDataAsync } = useSignTypedData();

  const callSignTypedData = useCallback(
    () =>
      signTypedDataAsync({
        ...signTypedData,
        domain: {
          ...signTypedData.domain,
          chainId,
        },
      }),
    [signTypedData, signTypedDataAsync, chainId]
  );
  return callSignTypedData;
}
