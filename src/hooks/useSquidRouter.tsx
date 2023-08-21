import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';
import { useSelector } from 'react-redux';
import { Squid, type GetRoute, type RouteResponse, ChainData, ChainType } from '@0xsquid/sdk';
import { USDC_DENOM } from '@dydxprotocol/v4-client';

import { TransferInputs } from '@/constants/abacus';
import { DydxV4Network, isDydxV4Network } from '@/constants/networks';
import { useAccounts } from '@/hooks/useAccounts';

import { getSelectedNetwork } from '@/state/appSelectors';

const SQUID_BASE_URL: Record<DydxV4Network, string | undefined> = {
  [DydxV4Network.V4Testnet2]: 'https://squid-api-git-feat-cosmos-maintestnet-0xsquid.vercel.app',
  [DydxV4Network.V4Staging]: undefined,
  [DydxV4Network.V4Local]: undefined,
  [DydxV4Network.V4Mainnet]: 'https://api.0xsquid.com',
};

/**
 * @description Deposit route defaults for IBC Testnet
 * */
export const SQUID_DEPOSIT_ROUTE_DEFAULTS = {
  toChain: 'dydx-testnet-2',
  toToken: USDC_DENOM,
  enableForecall: false, // instant execution service, defaults to true
};

export const SQUID_WITHDRAW_ROUTE_DEFAULTS = {
  fromChain: 'dydx-testnet-2',
  fromToken: USDC_DENOM,
  enableForecall: false, // instant execution service, defaults to true
};

const useSquidContext = () => {
  const selectedNetwork = useSelector(getSelectedNetwork);
  const [_, setInitialized] = useState(false);

  const initializeClient = async () => {
    setInitialized(false);
    if (!squid) return;
    await squid.init();
    setInitialized(true);
  };

  const squid = useMemo(
    () =>
      isDydxV4Network(selectedNetwork)
        ? new Squid({ baseUrl: SQUID_BASE_URL[selectedNetwork as DydxV4Network] })
        : undefined,
    [selectedNetwork]
  );

  useEffect(() => {
    if (squid) {
      initializeClient();
    }
  }, [squid]);

  return squid;
};

type SquidContextType = ReturnType<typeof useSquidContext>;
const SquidContext = createContext<SquidContextType>(undefined);
SquidContext.displayName = '0xSquid';

export const SquidProvider = ({ ...props }) => (
  <SquidContext.Provider value={useSquidContext()} {...props} />
);

export const useSquid = () => useContext(SquidContext);

export const useSquidRouter = () => {
  const squid = useSquid();
  const { signerWagmi } = useAccounts();

  const submitDeposit = useCallback(
    async (requestPayload: TransferInputs['requestPayload']) => {
      if (!signerWagmi) {
        throw new Error('Missing signer');
      }
      if (
        !requestPayload?.targetAddress ||
        !requestPayload.data ||
        !requestPayload.value ||
        !requestPayload.gasLimit ||
        !requestPayload.gasPrice ||
        !requestPayload.routeType
      ) {
        throw new Error('Missing request payload');
      }
      let tx = {
        to: requestPayload.targetAddress as `0x${string}`,
        data: requestPayload.data as `0x${string}`,
        gasLimit: ethers.toBigInt(requestPayload.gasLimit),
        value:
          requestPayload.routeType !== 'SEND' ? ethers.toBigInt(requestPayload.value) : undefined,
      };
      return await signerWagmi.sendTransaction(tx);
    },
    [signerWagmi]
  );

  const getStatus = useCallback(
    async (transactionId: string) => {
      const status = await squid?.getStatus({ transactionId });
      return status;
    },
    [squid]
  );

  return {
    getStatus,
    submitDeposit,

    axelarscanURL: squid?.axelarscanURL,
  };
};
