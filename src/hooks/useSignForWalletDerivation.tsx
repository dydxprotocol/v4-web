import { useCallback } from 'react';

import stableStringify from 'fast-json-stable-stringify';
import { useSignTypedData } from 'wagmi';

import { getSignTypedData } from '@/constants/wallets';

import { usePhantomWallet } from '@/hooks/usePhantomWallet';

import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';

import { WalletInfo } from '@/lib/wallet/types';

import { useEnvConfig } from './useEnvConfig';

export default function useSignForWalletDerivation(wallet: WalletInfo | undefined) {
  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);
  const ethereumChainId = useEnvConfig('ethereumChainId');
  const chainId = Number(ethereumChainId);

  const signTypedData = getSignTypedData(selectedDydxChainId);

  const { signTypedDataAsync } = useSignTypedData();

  const signEvmMessage = useCallback(
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

  const { signMessage: phantomSignMessage } = usePhantomWallet();

  const signSolanaMessage = useCallback(async (): Promise<string> => {
    const signature = await phantomSignMessage(stableStringify(signTypedData));
    // Left pad the signature with a 0 byte so that the signature is 65 bytes long, a solana signature is 64 bytes by default.
    return Buffer.from([0, ...signature]).toString('hex');
  }, [phantomSignMessage, signTypedData]);

  const signMessage = useCallback(async (): Promise<string> => {
    if (wallet?.connectorType === 'phantom') {
      return signSolanaMessage();
    }
    return signEvmMessage();
  }, [signEvmMessage, signSolanaMessage, wallet?.connectorType]);

  return signMessage;
}
