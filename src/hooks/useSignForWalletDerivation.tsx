import { useSelector } from 'react-redux';
import { useSignTypedData } from 'wagmi';

import { ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';
import { getSignTypedData } from '@/constants/wallets';

import { getSelectedDydxChainId, getSelectedNetwork } from '@/state/appSelectors';

export default function useSignForWalletDerivation() {
  const selectedDydxChainId = useSelector(getSelectedDydxChainId);
  const selectedNetwork = useSelector(getSelectedNetwork);
  const chainId = Number(ENVIRONMENT_CONFIG_MAP[selectedNetwork].ethereumChainId);

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
