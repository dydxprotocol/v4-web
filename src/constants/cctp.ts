import cctpTokens from '../../public/configs/cctp.json';
import { TransferType, TransferTypeType } from './abacus';

export type CctpTokenInfo = {
  chainId: string;
  tokenAddress: string;
  name: string;
};

type NullableTransferType = TransferTypeType | undefined | null;

const mainnetChains = cctpTokens.filter((token) => !token.isTestnet);

// Ethereum is a high fee chain for withdrawals but not deposits for Skip only
const getLowestFeeChains = (type: NullableTransferType, skipEnabled: boolean) =>
  type === TransferType.deposit
    ? mainnetChains
    : mainnetChains.filter(({ chainId }) => (skipEnabled ? chainId !== '1' : true));

// move this out if we need it in another module
const capitalizeNames = (str: string) => str[0].toUpperCase() + str.slice(1);

export const getLowestFeeChainNames = (type: NullableTransferType, skipEnabled: boolean) =>
  getLowestFeeChains(type, skipEnabled).map((token) => capitalizeNames(token.name.toLowerCase()));

export const getMapOfLowestFeeTokensByDenom = (type: NullableTransferType, skipEnabled: boolean) =>
  getLowestFeeChains(type, skipEnabled).reduce(
    (acc, token) => {
      if (!acc[token.tokenAddress]) {
        acc[token.tokenAddress] = [];
      }
      acc[token.tokenAddress].push(token);
      return acc;
    },
    {} as Record<string, CctpTokenInfo[]>
  );

export const getMapOfLowestFeeTokensByChainId = (
  type: NullableTransferType,
  skipEnabled: boolean
) =>
  getLowestFeeChains(type, skipEnabled).reduce(
    (acc, token) => {
      if (!acc[token.chainId]) {
        acc[token.chainId] = [];
      }
      acc[token.chainId].push(token);
      return acc;
    },
    {} as Record<string, CctpTokenInfo[]>
  );

export const cctpTokensByDenom = cctpTokens.reduce(
  (acc, token) => {
    if (!acc[token.tokenAddress]) {
      acc[token.tokenAddress] = [];
    }
    acc[token.tokenAddress].push(token);
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
