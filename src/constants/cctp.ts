import cctpTokens from '../../public/configs/cctp.json';
import { TransferType, TransferTypeType } from './abacus';

export type CctpTokenInfo = {
  chainId: string;
  tokenAddress: string;
  name: string;
};

type NullableTransferType = TransferTypeType | undefined | null;

// Ethereum is a high fee chain for withdrawals but not deposits
const getLowestFeeChains = (type: NullableTransferType) =>
  type === TransferType.deposit ? cctpTokens : cctpTokens.filter(({ chainId }) => chainId !== '1');

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

export const getMapOfLowestFeeTokensByChainId = (type: NullableTransferType) =>
  getLowestFeeChains(type).reduce(
    (acc, token) => {
      if (!acc[token.chainId]) {
        acc[token.chainId] = [];
      }
      acc[token.chainId].push(token);
      return acc;
    },
    {} as Record<string, CctpTokenInfo[]>
  );
