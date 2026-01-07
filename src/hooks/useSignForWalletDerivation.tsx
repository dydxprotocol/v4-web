import { useCallback, useMemo } from 'react';

import { BECH32_PREFIX } from '@dydxprotocol/v4-client-js';
import stableStringify from 'fast-json-stable-stringify';
import { useSignTypedData } from 'wagmi';

import { ConnectorType, DydxAddress, getSignTypedData, WalletInfo } from '@/constants/wallets';

import { usePhantomWallet } from '@/hooks/usePhantomWallet';

import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';

import { signMessageWithKeplr } from '@/lib/keplrUtils';
import { deriveCosmosWalletFromSigner } from '@/lib/onboarding/deriveCosmosWallets';

import { useEnvConfig } from './useEnvConfig';
import { useWalletConnection } from './useWalletConnection';

export default function useSignForWalletDerivation(wallet: WalletInfo | undefined) {
  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);
  const ethereumChainId = useEnvConfig('ethereumChainId');
  const chainId = Number(ethereumChainId);
  const { getCosmosOfflineSigner } = useWalletConnection();

  const signTypedData = useMemo(() => getSignTypedData(selectedDydxChainId), [selectedDydxChainId]);

  const { signTypedDataAsync } = useSignTypedData();

  const signCosmosMessage = useCallback(async (): Promise<string> => {
    const offlineSigner = await getCosmosOfflineSigner(selectedDydxChainId);

    if (!offlineSigner) {
      throw new Error('No offline signer found');
    }

    const dydxWallet = await deriveCosmosWalletFromSigner(offlineSigner, BECH32_PREFIX);

    if (!dydxWallet) {
      throw new Error('Failed to derive Cosmos wallet');
    }

    const signature = await signMessageWithKeplr(
      stableStringify(signTypedData),
      dydxWallet.address as DydxAddress,
      selectedDydxChainId
    );

    return signature;
  }, [signTypedData, selectedDydxChainId, getCosmosOfflineSigner]);

  const signEvmMessage = useCallback(
    (isMetaMask: boolean) =>
      signTypedDataAsync({
        ...signTypedData,
        domain: {
          ...signTypedData.domain,
          ...(isMetaMask ? ({ verifyingContract: '' } as {}) : {}),
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
    if (wallet?.connectorType === ConnectorType.Cosmos) {
      return signCosmosMessage();
    }

    if (wallet?.connectorType === ConnectorType.PhantomSolana) {
      return signSolanaMessage();
    }

    const isMetaMask =
      wallet?.connectorType === ConnectorType.Injected && wallet.name === 'MetaMask';

    return signEvmMessage(isMetaMask);
  }, [signEvmMessage, signSolanaMessage, signCosmosMessage, wallet?.connectorType, wallet?.name]);

  return signMessage;
}
