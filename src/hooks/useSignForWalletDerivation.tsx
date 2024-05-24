import { useSelector } from 'react-redux';
import { useSignTypedData } from 'wagmi';

import { getSignTypedData } from '@/constants/wallets';

import { getSelectedDydxChainId } from '@/state/appSelectors';

import { useEnvConfig } from './useEnvConfig';

export default function useSignForWalletDerivation() {
  const selectedDydxChainId = useSelector(getSelectedDydxChainId);
  const ethereumChainId = useEnvConfig('ethereumChainId');
  const chainId = Number(ethereumChainId);

  const signTypedData = getSignTypedData(selectedDydxChainId);
  const { signTypedDataAsync } = useSignTypedData({
    ...signTypedData,
    domain: {
      ...signTypedData.domain,
      chainId,
    },
  });
  return signTypedDataAsync;
}
