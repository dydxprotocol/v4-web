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

import { wrapAndLogError } from '@/lib/asyncUtils';
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
  let signers: SignerGetters | undefined;
  let options: SkipClientOptions | undefined;
  let skipClientPromise: Promise<typeof import('@skip-go/client')> | null = null;
  let hasNewOptions = false;

  // Lazy loader for the skip client
  const makeOrGetSkiplient = async () => {
    if (!skipClientPromise) {
      skipClientPromise = import('@skip-go/client');
    }
    const skipClient = await skipClientPromise;

    // Apply options if they were set before the client was loaded
    if (hasNewOptions && options) {
      skipClient.setClientOptions(options);
      hasNewOptions = false;
    }

    return skipClient;
  };

  return {
    setOptions: (newOptions: SkipClientOptions = {}) => {
      options = newOptions;
      hasNewOptions = true;
    },

    setSigners: (newSigners: SignerGetters) => {
      signers = newSigners;
    },

    route: async (req: Parameters<typeof route>[0]) => {
      const skipClient = await makeOrGetSkiplient();
      return wrapAndLogError(() => skipClient.route(req), 'skipClient/route', true)();
    },

    balances: async (req: Parameters<typeof balances>[0]) => {
      const skipClient = await makeOrGetSkiplient();
      return skipClient.balances(req);
    },

    messagesDirect: async (req: Parameters<typeof messagesDirect>[0]) => {
      const skipClient = await makeOrGetSkiplient();
      return skipClient.messagesDirect(req);
    },

    messages: async (req: Parameters<typeof messages>[0]) => {
      const skipClient = await makeOrGetSkiplient();
      return skipClient.messages(req);
    },

    executeRoute: async (req: Parameters<typeof executeRoute>[0]) => {
      const skipClient = await makeOrGetSkiplient();
      return skipClient.executeRoute({ ...signers, ...req });
    },

    waitForTransaction: async (req: Parameters<typeof waitForTransaction>[0]) => {
      const skipClient = await makeOrGetSkiplient();
      return skipClient.waitForTransaction(req);
    },
  };
}

const skipClient = makeLazySkipClient();

export type SkipClient = ReturnType<typeof makeLazySkipClient>;

export function getSkipClient() {
  return skipClient;
}

const useSkipClientContext = () => {
  const { solanaRpcUrl, nobleValidator, neutronValidator, osmosisValidator, validators, skip } =
    useEndpointsConfig();

  const { compositeClient } = useCompositeClient();
  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);
  const { sourceAccount, localDydxWallet } = useAccounts();
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
          if (!localDydxWallet?.offlineSigner) {
            throw new Error('no cosmos wallet connected');
          }
          return localDydxWallet.offlineSigner;
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
  }, [sourceAccount.chain, wagmiConfig, localDydxWallet]);

  useEffect(() => {
    const options: SkipClientOptions = {
      apiUrl: skip,
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
    skip,
    solanaRpcUrl,
    validators,
  ]);

  return { skipClient, instanceId };
};
