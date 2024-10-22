import { Asset } from '@skip-go/client';

import cctpTokens from '../../public/configs/cctp.json';
import { TransferType, TransferTypeType } from './abacus';
import { TransferType as NewTransferType } from './transfers';

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
const capitalizeNames = (str: string) => str[0]!.toUpperCase() + str.slice(1);

export const getLowestFeeChainNames = (type: NullableTransferType) =>
  getLowestFeeChains(type).map((token) => capitalizeNames(token.name.toLowerCase()));

export const getMapOfLowestFeeTokensByDenom = (type: NullableTransferType) =>
  getLowestFeeChains(type).reduce(
    (acc, token) => {
      if (!acc[token.tokenAddress]) {
        acc[token.tokenAddress] = [];
        acc[token.tokenAddress.toLowerCase()] = [];
      }
      acc[token.tokenAddress]!.push(token);
      acc[token.tokenAddress.toLowerCase()]!.push(token);
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
      acc[token.chainId]!.push(token);
      return acc;
    },
    {} as Record<string, CctpTokenInfo[]>
  );

// TODO: Refactor/remove these once we delete old deposit/withdraw components
export const getMapOfLowestFeeTokensByChainId = (type: NullableTransferType) =>
  getMapOfChainsByChainId(getLowestFeeChains(type));

export const getMapOfHighestFeeTokensByChainId = (type: NullableTransferType) =>
  getMapOfChainsByChainId(getHighestFeeChains(type));

const lowestFeeTokensByChainIdMapDeposit = getMapOfLowestFeeTokensByChainId(TransferType.deposit);
const lowestFeeTokensByChainIdMapWithdrawal = getMapOfLowestFeeTokensByChainId(
  TransferType.withdrawal
);

const lowestFeeTokensByDenomDeposit = getMapOfLowestFeeTokensByDenom(TransferType.deposit);
const lowestFeeTokensByDenomWithdrawal = getMapOfLowestFeeTokensByDenom(TransferType.withdrawal);

// TODO: refactor these functions to include cosmos chains and denoms in lowest fees.
// This will probably involve a non trivial amount of work so do in separate PR.
export const isLowFeeChainId = (chainId: string, type: NewTransferType) => {
  const lowFeeChainIdMap =
    type === NewTransferType.Deposit
      ? lowestFeeTokensByChainIdMapDeposit
      : lowestFeeTokensByChainIdMapWithdrawal;
  return lowFeeChainIdMap[chainId];
};

export const isHighFeeChainId = (chainId: string, type: NewTransferType) => {
  return type === NewTransferType.Withdraw && chainId === '1';
};

export const isLowFeeDenom = (denom: string, type: NewTransferType) => {
  const lowFeeDenomMap =
    type === NewTransferType.Deposit
      ? lowestFeeTokensByDenomDeposit
      : lowestFeeTokensByDenomWithdrawal;
  return lowFeeDenomMap[denom.toLowerCase()];
};

export const cctpTokensByDenomLowerCased = cctpTokens.reduce(
  (acc, token) => {
    const lowerCasedAddress = token.tokenAddress.toLowerCase();
    if (!acc[lowerCasedAddress]) {
      acc[lowerCasedAddress] = [];
    }
    acc[lowerCasedAddress]!.push(token);
    return acc;
  },
  {} as Record<string, CctpTokenInfo[]>
);

export const cctpTokensByChainId = cctpTokens.reduce(
  (acc, token) => {
    if (!acc[token.chainId]) {
      acc[token.chainId] = [];
    }
    acc[token.chainId]!.push(token);
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
