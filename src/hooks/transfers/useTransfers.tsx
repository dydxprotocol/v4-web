import { createContext, useCallback, useContext, useState } from 'react';

import { NOBLE_BECH32_PREFIX } from '@dydxprotocol/v4-client-js';
import { MsgsDirectRequest } from '@skip-go/client';
import { useQuery } from '@tanstack/react-query';
import { debounce } from 'lodash';
import { parseUnits } from 'viem';

import { isDenomCctp } from '@/constants/cctp';
import {
  getNeutronChainId,
  getNobleChainId,
  getOsmosisChainId,
  NEUTRON_BECH32_PREFIX,
  OSMO_BECH32_PREFIX,
} from '@/constants/graz';
import { DydxAddress, EvmAddress, SolAddress, WalletType } from '@/constants/wallets';

import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';

import { convertBech32Address } from '@/lib/addressUtils';

import { skipClient } from '../../lib/skip';
import { useAccounts } from '../useAccounts';
import { useLocalNotifications } from '../useLocalNotifications';

export enum TransferType {
  Deposit = 'DEPOSIT',
  Withdraw = 'WITHDRAW',
}

type NetworkType = 'evm' | 'svm' | 'cosmos' | 'unknown';
const getNetworkTypeFromWallet = (connectedWalletInfo?: WalletInfo): NetworkType => {
  if (connectedWalletInfo?.connectorType === ConnectorType.Injected) {
    return 'evm';
  }
  if (connectedWalletInfo?.connectorType === ConnectorType.PhantomSolana) {
    return 'svm';
  }
  if (connectedWalletInfo?.connectorType === ConnectorType.Cosmos) {
    return 'cosmos';
  }
  return 'unknown';
};

type TransfersContextType = ReturnType<typeof useTransfersContext>;
const TransfersContext = createContext<TransfersContextType | undefined>(undefined);
TransfersContext.displayName = 'Transfers';

export const useTransfers = () => {
  const context = useContext(TransfersContext);
  if (!context) {
    throw new Error('useTransfers must be used within an TransfersProvider');
  }
  return context;
};

export const TransfersProvider = ({ ...props }) => {
  return <TransfersContext.Provider value={useTransfersContext()} {...props} />;
};

const useTransfersContext = () => {
  const { dydxAddress, evmAddress, solAddress, nobleAddress, connectedWallet } = useAccounts();
  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);

  const [fromTokenDenom, setFromTokenDenom] = useState<string | null>(null);
  const [fromChainId, setFromChainId] = useState<string>('1');
  const [toTokenDenom, setToTokenDenom] = useState<string | null>(null);
  const [toChainId, setToChainId] = useState<string | null>(null);
  const [fromAddress, setFromAddress] = useState<EvmAddress | SolAddress | DydxAddress | undefined>(
    undefined
  );
  const [toAddress, setToAddress] = useState<EvmAddress | SolAddress | DydxAddress | undefined>(
    undefined
  );
  const [transferType, setTransferType] = useState<TransferType>(TransferType.Withdraw);
  const [amount, setAmount] = useState<string>('');
  const [decimals, setDecimals] = useState<number>(0);

  const getDepositSourceAddress = () => {
    if (connectedWallet?.name === WalletType.Keplr && nobleAddress) {
      return nobleAddress;
      // put sol first. some users with phantom wallet have previously connected with evm
      // so they will have both sol and evm addresses. we assume the phantom wallet
      // is connected with a sol address, not evm.
    }
    if (solAddress) {
      return solAddress;
    }
    return evmAddress;
  };

  const debouncedMsgsDirect = useCallback(
    debounce((v: MsgsDirectRequest) => skipClient.msgsDirect(v), 500),
    []
  );

  const hasAllParams =
    !!fromTokenDenom &&
    !!toTokenDenom &&
    !!toChainId &&
    !!fromChainId &&
    !!fromAddress &&
    !!toAddress &&
    !!transferType &&
    !!amount &&
    !!dydxAddress;

  const routeQuery = useQuery({
    queryKey: [
      'transferRoute',
      fromTokenDenom,
      toTokenDenom,
      fromChainId,
      toChainId,
      fromAddress,
      toAddress,
      amount,
    ],
    queryFn: async () => {
      // return { route: {}, txs: [{ evmTx: {} }] };
      console.log('route query fn hit', {
        fromTokenDenom,
        toTokenDenom,
        toChainId,
        fromChainId,
        fromAddress,
        toAddress,
        transferType,
        amount,
        dydxAddress,
      });

      if (transferType === TransferType.Withdraw) {
        // Non cctp withdrawals
        return skipClient.msgsDirect({
          sourceAssetDenom: fromTokenDenom,
          sourceAssetChainID: fromChainId,
          destAssetDenom: toTokenDenom,
          destAssetChainID: toChainId,
          chainIdsToAddresses: {
            [selectedDydxChainId]: dydxAddress,
          },
          //
          // swapVenue?: SwapVenueRequest,
          // swapVenues?: SwapVenueRequest[],
          allowUnsafe: true,

          // set bridges specifically
          // bridges?: BridgeType[],

          // only for CCTP, maybe?
          // allowMultiTx?: boolean,
          smartRelay: true,
          // smartSwapOptions?: SmartSwapOptions,
          allowSwaps: true,
          amountIn: parseUnits(amount, decimals).toString(),
        });
      }
      const sourceAddress = getDepositSourceAddress();
      if (isDenomCctp(fromTokenDenom)) {
        // CCTP Deposits
        return skipClient.msgsDirect({
          sourceAssetDenom: fromTokenDenom,
          sourceAssetChainID: fromChainId,
          destAssetDenom: toTokenDenom,
          destAssetChainID: toChainId,
          chainIdsToAddresses: {
            [fromChainId]: sourceAddress,
            [toChainId]: dydxAddress,
          },
          allowUnsafe: true,
          bridges: ['CCTP', 'IBC'],
          smartRelay: true,
          amountIn: parseUnits(amount, decimals).toString(),
        });
      }
      return skipClient.msgsDirect({
        sourceAssetDenom: fromTokenDenom,
        sourceAssetChainID: fromChainId,
        destAssetDenom: toTokenDenom,
        destAssetChainID: toChainId,
        chainIdsToAddresses: {
          [fromChainId]: sourceAddress,
          [toChainId]: dydxAddress,
          [getOsmosisChainId()]: convertBech32Address({
            address: dydxAddress,
            bech32Prefix: OSMO_BECH32_PREFIX,
          }),
          [getNeutronChainId()]: convertBech32Address({
            address: dydxAddress,
            bech32Prefix: NEUTRON_BECH32_PREFIX,
          }),
          [getNobleChainId()]: convertBech32Address({
            address: dydxAddress,
            bech32Prefix: NOBLE_BECH32_PREFIX,
          }),
        },
        allowUnsafe: true,
        bridges: ['CCTP', 'IBC', 'AXELAR'],
        smartSwapOptions: { evmSwaps: true, splitRoutes: true },
        amountIn: parseUnits(amount, decimals).toString(),
        slippageTolerancePercent: '1',
        swapVenues: [
          {
            name: 'ethereum-uniswap',
            chainID: '1',
          },
          {
            name: 'polygon-uniswap',
            chainID: '137',
          },
          {
            name: 'optimism-uniswap',
            chainID: '10',
          },
          {
            name: 'arbitrum-uniswap',
            chainID: '42161',
          },
          {
            name: 'base-uniswap',
            chainID: '8453',
          },
          {
            name: 'avalanche-uniswap',
            chainID: '43114',
          },
          {
            name: 'binance-uniswap',
            chainID: '56',
          },
          {
            name: 'celo-uniswap',
            chainID: '42220',
          },
          {
            name: 'blast-uniswap',
            chainID: '81457',
          },
          {
            name: 'osmosis-poolmanager',
            chainID: 'osmosis-1',
          },
          {
            name: 'neutron-astroport',
            chainID: 'neutron-1',
          },
        ],
      });
    },
    enabled: hasAllParams,
  });

  const route = routeQuery?.data;
  // console.log('route', route);
  const { addOrUpdateTransferNotification } = useLocalNotifications();

  // const setDefaultTokenAndChain = () => {
  //   const
  // }

  return {
    fromTokenDenom,
    setFromTokenDenom,
    fromChainId,
    setFromChainId,
    toTokenDenom,
    setToTokenDenom,
    toChainId,
    setToChainId,
    fromAddress,
    setFromAddress,
    toAddress,
    setToAddress,
    amount,
    setAmount,
    transferType,
    setTransferType,
    route,
    setDecimals,
  };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// const submitEvmRoute = () => {
//   if (!route) return;
//   skipClient.executeRoute({
//     route,
//     onTransactionTracked: async ({ txHash, chainID }) => {
//       addOrUpdateTransferNotification();
//     },
//     userAddresses: {},
//   });
// };
// const submitCosmosRoute = () => {
//   if (!route) return;
//   skipClient.executeRoute({
//     route,
//     onTransactionTracked: ({ txHash, chainID }) => {
//       addOrUpdateTransferNotification();
//     },
//     userAddresses: {},
//   });
// };
// const submitSvmRoute = () => {
//   if (!route) return;
//   skipClient.executeRoute({
//     route,
//     onTransactionTracked: ({ txHash, chainID }) => {
//       addOrUpdateTransferNotification();
//     },
//     userAddresses: {},
//   });
// };
