import { createContext, useCallback, useContext, useMemo } from 'react';

import {
  MsgWithdrawFromSubaccount,
  TYPE_URL_MSG_WITHDRAW_FROM_SUBACCOUNT,
} from '@dydxprotocol/v4-client-js';
import { SkipClient } from '@skip-go/client';
import { useWalletClient } from 'wagmi';

import { getNeutronChainId, getNobleChainId, getOsmosisChainId } from '@/constants/graz';
import { getSolanaChainId } from '@/constants/solana';
import { WalletNetworkType } from '@/constants/wallets';

import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';

import { RPCUrlsByChainId } from '@/lib/wagmi';

import { useAccounts } from '../useAccounts';
import { useDydxClient } from '../useDydxClient';
import { useEndpointsConfig } from '../useEndpointsConfig';

type SkipContextType = ReturnType<typeof useSkipClientContext>;
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
  const { sourceAccount } = useAccounts();
  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);

  const { data: client } = useWalletClient();
  const getEVMSigner = useCallback(() => {
    if (!sourceAccount.walletInfo || sourceAccount.chain !== WalletNetworkType.Evm) {
      throw new Error('Wallet is not evm');
    }

    if (!client) {
      throw new Error('wallet not connected');
    }

    return Promise.resolve(client);
  }, [client, sourceAccount.chain, sourceAccount.walletInfo]);

  // skipInstanceId is used to track unique instances of skipClient
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
        registryTypes: [[TYPE_URL_MSG_WITHDRAW_FROM_SUBACCOUNT, MsgWithdrawFromSubaccount]],
        getEVMSigner,
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
      validators,
      getEVMSigner,
    ]
  );

  return { skipClient, skipInstanceId };
};
