import { createContext, useContext, useEffect, useMemo, useRef } from 'react';

import {
  MsgWithdrawFromSubaccount,
  TYPE_URL_MSG_WITHDRAW_FROM_SUBACCOUNT,
} from '@dydxprotocol/v4-client-js';
import { SkipClient } from '@skip-go/client';
import { WalletClient } from 'viem';
import { useWalletClient } from 'wagmi';

import { getNeutronChainId, getNobleChainId, getOsmosisChainId } from '@/constants/graz';
import { getSolanaChainId } from '@/constants/solana';
import { WalletNetworkType } from '@/constants/wallets';

import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';
import { SourceAccount } from '@/state/wallet';

import { RPCUrlsByChainId } from '@/lib/wagmi';

import { useAccounts } from '../useAccounts';
import { useDydxClient } from '../useDydxClient';
import { useEndpointsConfig } from '../useEndpointsConfig';

type SkipContextType = ReturnType<typeof useSkipClientContext>;
export type SkipRouteSpeed = 'slow' | 'fast';
const SkipContext = createContext<SkipContextType>({} as SkipContextType);
SkipContext.displayName = 'skipClient';

export const SkipProvider = ({ ...props }) => (
  <SkipContext.Provider value={useSkipClientContext()} {...props} />
);

export const useSkipClient = () => useContext(SkipContext);

const useSkipClientContext = () => {
  const { solanaRpcUrl, nobleValidator, neutronValidator, osmosisValidator, validators } =
    useEndpointsConfig();
  const { compositeClient } = useDydxClient();
  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);
  const { sourceAccount } = useAccounts();

  const { data: walletClient } = useWalletClient();
  const walletClientRef = useRef(walletClient);
  useEffect(() => {
    if (!walletClient) return;
    walletClientRef.current = walletClient;
  }, [walletClient]);

  const { skipClient, skipInstanceId } = useMemo(
    () => ({
      skipClient: new SkipClient({
        endpointOptions: {
          getRpcEndpointForChain: async (chainId: string) => {
            if (chainId === getNobleChainId()) return nobleValidator;
            if (chainId === getNeutronChainId()) return neutronValidator;
            if (chainId === getOsmosisChainId()) return osmosisValidator;
            if (chainId === selectedDydxChainId)
              return compositeClient?.network.validatorConfig.restEndpoint ?? validators[0]!;
            if (chainId === getSolanaChainId()) return solanaRpcUrl;
            const evmRpcUrls = RPCUrlsByChainId[chainId];
            if (evmRpcUrls?.length) return evmRpcUrls[0]!;
            throw new Error(`Error: no rpc endpoint found for chainId: ${chainId}`);
          },
        },
        getEVMSigner: async () => getEVMSigner(walletClientRef.current, sourceAccount),
        getSVMSigner: async () => {
          if (sourceAccount.chain !== WalletNetworkType.Solana || !window.phantom?.solana) {
            throw new Error('no solana wallet connected');
          }

          await window.phantom.solana.connect();
          return (window as any).phantom.solana;
        },
        getCosmosSigner: async (chainId: string) => {
          if (sourceAccount.chain !== WalletNetworkType.Cosmos) {
            throw new Error('no cosmos wallet connected');
          }
          if (!window.keplr) {
            throw new Error('keplr wallet not connected');
          }

          return window.keplr.getOfflineSigner(chainId);
        },
        registryTypes: [[TYPE_URL_MSG_WITHDRAW_FROM_SUBACCOUNT, MsgWithdrawFromSubaccount]],
      }),
      skipInstanceId: crypto.randomUUID(),
    }),
    [
      compositeClient?.network.validatorConfig.restEndpoint,
      neutronValidator,
      nobleValidator,
      osmosisValidator,
      selectedDydxChainId,
      solanaRpcUrl,
      sourceAccount,
      validators,
    ]
  );
  return { skipClient, skipInstanceId };
};

const getEVMSigner = async (
  walletClient: WalletClient | undefined,
  sourceAccount: SourceAccount
) => {
  if (!sourceAccount.walletInfo || sourceAccount.chain !== WalletNetworkType.Evm) {
    throw new Error('Wallet is not evm');
  }

  if (!walletClient) {
    throw new Error('wallet not connected');
  }

  return Promise.resolve(walletClient);
};
