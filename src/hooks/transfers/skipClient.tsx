import { createContext, useContext, useEffect, useState } from 'react';

// eslint-disable-next-line no-restricted-imports
import { useCompositeClient } from '@/bonsai/rest/lib/useIndexer';
import {
  MsgWithdrawFromSubaccount,
  TYPE_URL_MSG_WITHDRAW_FROM_SUBACCOUNT,
} from '@dydxprotocol/v4-client-js';
import {
  balances,
  executeRoute,
  messages,
  messagesDirect,
  route,
  setClientOptions,
  SkipClientOptions,
  waitForTransaction,
} from '@skip-go/client';
import { getWalletClient } from '@wagmi/core';
import { WalletClient } from 'viem';
import { useConfig } from 'wagmi';

import { getNeutronChainId, getNobleChainId, getOsmosisChainId } from '@/constants/graz';
import { getSolanaChainId } from '@/constants/solana';
import { WalletNetworkType } from '@/constants/wallets';

import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';

import { RPCUrlsByChainId } from '@/lib/wagmi';

import { useAccounts } from '../useAccounts';
import { useEndpointsConfig } from '../useEndpointsConfig';

type SkipContextType = ReturnType<typeof useSkipClientContext>;
export type SkipRouteSpeed = 'slow' | 'fast';
const SkipContext = createContext<SkipContextType>({} as SkipContextType);
SkipContext.displayName = 'skipClient';

export const SkipProvider = ({ ...props }) => (
  <SkipContext.Provider value={useSkipClientContext()} {...props} />
);

export const useSkipClient = () => useContext(SkipContext);

type SignerGetters = Pick<
  Parameters<typeof executeRoute>[0],
  'getEvmSigner' | 'getSvmSigner' | 'getCosmosSigner'
>;

function makeLazySkipClient() {
  let signers: SignerGetters;

  return {
    setOptions: (options: SkipClientOptions = {}) => {
      setClientOptions(options);
    },
    setSigners: (newSigners: SignerGetters) => {
      signers = newSigners;
    },
    route: (req: Parameters<typeof route>[0]) => {
      return route(req);
    },
    balances: (req: Parameters<typeof balances>[0]) => {
      return balances(req);
    },
    messagesDirect: (req: Parameters<typeof messagesDirect>[0]) => {
      return messagesDirect(req);
    },
    messages: (req: Parameters<typeof messages>[0]) => {
      return messages(req);
    },
    executeRoute: (req: Parameters<typeof executeRoute>[0]) => {
      return executeRoute({ ...signers, ...req });
    },
    waitForTransaction: (req: Parameters<typeof waitForTransaction>[0]) => {
      return waitForTransaction(req);
    },
  };
}

const skipClient = makeLazySkipClient();

export type SkipClient = ReturnType<typeof makeLazySkipClient>;

export function getSkipClient() {
  return skipClient;
}

const useSkipClientContext = () => {
  const { solanaRpcUrl, nobleValidator, neutronValidator, osmosisValidator, validators } =
    useEndpointsConfig();
  const { compositeClient } = useCompositeClient();
  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);
  const { sourceAccount } = useAccounts();
  const wagmiConfig = useConfig();

  const [instanceId, setInstanceId] = useState<string>();

  useEffect(() => {
    const signers: SignerGetters = {
      getSvmSigner: async () => {
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
      getEvmSigner: async (chainId: string) => {
        if (sourceAccount.chain !== WalletNetworkType.Evm) {
          throw new Error('no EVM wallet connected');
        }

        const evmWalletClient = (await getWalletClient(wagmiConfig, {
          chainId: Number(chainId),
        })) as WalletClient;

        return evmWalletClient;
      },
    };

    skipClient.setSigners(signers);
    const id = crypto.randomUUID();
    setInstanceId(id);
  }, [sourceAccount.chain, wagmiConfig]);

  useEffect(() => {
    const options: SkipClientOptions = {
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
      registryTypes: [[TYPE_URL_MSG_WITHDRAW_FROM_SUBACCOUNT, MsgWithdrawFromSubaccount]],
    };

    skipClient.setOptions(options);
    const id = crypto.randomUUID();
    setInstanceId(id);
  }, [
    compositeClient?.network.validatorConfig.restEndpoint,
    neutronValidator,
    nobleValidator,
    osmosisValidator,
    selectedDydxChainId,
    solanaRpcUrl,
    validators,
  ]);

  return { skipClient, instanceId };
};
