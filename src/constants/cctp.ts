import { Asset } from '@skip-go/client';

import cctpTokens from '../../public/configs/cctp.json';
import { TransferType, TransferTypeType } from './abacus';

export type CctpTokenInfo = {
  chainId: string;
  tokenAddress: string;
  name: string;
  isTestnet?: boolean;
};

type NullableTransferType = TransferTypeType | undefined | null;

const mainnetChains = cctpTokens.filter((token) => !token.isTestnet);

// Ethereum is a high fee chain for withdrawals but not deposits for Skip only
const getLowestFeeChains = (type: NullableTransferType) =>
  type === TransferType.deposit
    ? mainnetChains
    : mainnetChains.filter(({ chainId }) => chainId !== '1');

const getHighestFeeChains = (type: NullableTransferType) =>
  type === TransferType.withdrawal ? mainnetChains.filter(({ chainId }) => chainId === '1') : [];

// move this out if we need it in another module
const capitalizeNames = (str: string) => str[0].toUpperCase() + str.slice(1);

export const getLowestFeeChainNames = (type: NullableTransferType) =>
  getLowestFeeChains(type).map((token) => capitalizeNames(token.name.toLowerCase()));

export const getMapOfLowestFeeTokensByDenom = (type: NullableTransferType) =>
  getLowestFeeChains(type).reduce(
    (acc, token) => {
      if (!acc[token.tokenAddress]) {
        acc[token.tokenAddress] = [];
      }
      acc[token.tokenAddress].push(token);
      return acc;
    },
    {} as Record<string, CctpTokenInfo[]>
  );

const getMapOfChainsByChainId = (chains: CctpTokenInfo[]) =>
  chains.reduce(
    (acc, token) => {
      if (!acc[token.chainId]) {
        acc[token.chainId] = [];
      }
      acc[token.chainId].push(token);
      return acc;
    },
    {} as Record<string, CctpTokenInfo[]>
  );

export const getMapOfLowestFeeTokensByChainId = (type: NullableTransferType) =>
  getMapOfChainsByChainId(getLowestFeeChains(type));

export const getMapOfHighestFeeTokensByChainId = (type: NullableTransferType) =>
  getMapOfChainsByChainId(getHighestFeeChains(type));

export const cctpTokensByDenomLowerCased = cctpTokens.reduce(
  (acc, token) => {
    const lowerCasedAddress = token.tokenAddress.toLowerCase();
    if (!acc[lowerCasedAddress]) {
      acc[lowerCasedAddress] = [];
    }
    acc[lowerCasedAddress].push(token);
    return acc;
  },
  {} as Record<string, CctpTokenInfo[]>
);

export const cctpTokensByChainId = cctpTokens.reduce(
  (acc, token) => {
    if (!acc[token.chainId]) {
      acc[token.chainId] = [];
    }
    acc[token.chainId].push(token);
    return acc;
  },
  {} as Record<string, CctpTokenInfo[]>
);

export const isTokenCctp = (token: Asset | undefined) => {
  return isDenomCctp(token?.denom);
};

const isDenomCctp = (denom: string | undefined) => {
  if (!denom) return false;
  return Boolean(cctpTokensByDenomLowerCased[denom.toLowerCase()]);
};
