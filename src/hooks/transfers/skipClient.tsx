import { createContext, useContext, useMemo } from 'react';

import {
  MsgWithdrawFromSubaccount,
  TYPE_URL_MSG_WITHDRAW_FROM_SUBACCOUNT,
} from '@dydxprotocol/v4-client-js';
import { SkipClient } from '@skip-go/client';

import { getNeutronChainId, getNobleChainId, getOsmosisChainId } from '@/constants/graz';
import { getSolanaChainId } from '@/constants/solana';

import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';

import { RPCUrlsByChainId } from '@/lib/wagmi';

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
    ]
  );
  return { skipClient, skipInstanceId };
};
