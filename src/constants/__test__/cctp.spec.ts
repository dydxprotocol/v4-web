import { describe, expect, it } from 'vitest';

import {
  getLowestFeeChainNames,
  getMapOfHighestFeeTokensByChainId,
  getMapOfLowestFeeTokensByChainId,
  getMapOfLowestFeeTokensByDenom,
  isTokenCctp,
} from '@/constants/cctp';

import cctpTokens from '../../../public/configs/cctp.json';
import { TransferType } from '../abacus';

describe('getLowestFeeChainNames', () => {
  it('withdrawals skip - returns non eth cctp mainnet chain names as an array', () => {
    expect(getLowestFeeChainNames(TransferType.withdrawal)).toEqual([
      'Avalanche',
      'Optimism',
      'Arbitrum',
      'Base',
      'Polygon',
      'Solana',
    ]);
  });
  it('deposits skip - returns all cctp mainnet chain names as an array', () => {
    expect(getLowestFeeChainNames(TransferType.deposit)).toEqual([
      'Ethereum',
      'Avalanche',
      'Optimism',
      'Arbitrum',
      'Base',
      'Polygon',
      'Solana',
    ]);
  });
});

describe('getMapOfLowestFeeTokensByDenom', () => {
  it('withdrawals skip - returns a map of token denom/addresses to token information except for ETH USDC', () => {
    expect(getMapOfLowestFeeTokensByDenom(TransferType.withdrawal)).toEqual({
      '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E': [
        {
          chainId: '43114',
          tokenAddress: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
          name: 'Avalanche',
        },
      ],
      '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e': [
        {
          chainId: '43114',
          tokenAddress: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
          name: 'Avalanche',
        },
      ],
      '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85': [
        {
          chainId: '10',
          tokenAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
          name: 'optimism',
        },
      ],
      '0x0b2c639c533813f4aa9d7837caf62653d097ff85': [
        {
          chainId: '10',
          tokenAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
          name: 'optimism',
        },
      ],
      '0xaf88d065e77c8cC2239327C5EDb3A432268e5831': [
        {
          chainId: '42161',
          tokenAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
          name: 'arbitrum',
        },
      ],
      '0xaf88d065e77c8cc2239327c5edb3a432268e5831': [
        {
          chainId: '42161',
          tokenAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
          name: 'arbitrum',
        },
      ],
      '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913': [
        {
          chainId: '8453',
          tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          name: 'Base',
        },
      ],
      '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': [
        {
          chainId: '8453',
          tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          name: 'Base',
        },
      ],
      '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359': [
        {
          chainId: '137',
          tokenAddress: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
          name: 'Polygon',
        },
        {
          chainId: '137',
          tokenAddress: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
          name: 'Polygon',
        },
      ],
      EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: [
        {
          chainId: 'solana',
          name: 'solana',
          tokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        },
      ],
      epjfwdd5aufqssqem2qn1xzybapc8g4weggkzwytdt1v: [
        {
          chainId: 'solana',
          name: 'solana',
          tokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        },
      ],
    });
  });
  it('deposits skip - returns a map of token denom/addresses to token information including ETH USDC', () => {
    expect(getMapOfLowestFeeTokensByDenom(TransferType.deposit)).toEqual({
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': [
        {
          chainId: '1',
          tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          name: 'Ethereum',
        },
      ],
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': [
        {
          chainId: '1',
          tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          name: 'Ethereum',
        },
      ],
      '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E': [
        {
          chainId: '43114',
          tokenAddress: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
          name: 'Avalanche',
        },
      ],
      '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e': [
        {
          chainId: '43114',
          tokenAddress: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
          name: 'Avalanche',
        },
      ],
      '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85': [
        {
          chainId: '10',
          tokenAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
          name: 'optimism',
        },
      ],
      '0x0b2c639c533813f4aa9d7837caf62653d097ff85': [
        {
          chainId: '10',
          tokenAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
          name: 'optimism',
        },
      ],
      '0xaf88d065e77c8cC2239327C5EDb3A432268e5831': [
        {
          chainId: '42161',
          tokenAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
          name: 'arbitrum',
        },
      ],
      '0xaf88d065e77c8cc2239327c5edb3a432268e5831': [
        {
          chainId: '42161',
          tokenAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
          name: 'arbitrum',
        },
      ],
      '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913': [
        {
          chainId: '8453',
          tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          name: 'Base',
        },
      ],
      '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': [
        {
          chainId: '8453',
          tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          name: 'Base',
        },
      ],
      // This is fine, this denom is already written in lowercase so it just gets duplicated. it doesn't affect anything
      '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359': [
        {
          chainId: '137',
          tokenAddress: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
          name: 'Polygon',
        },
        {
          chainId: '137',
          tokenAddress: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
          name: 'Polygon',
        },
      ],
      EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: [
        {
          chainId: 'solana',
          name: 'solana',
          tokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        },
      ],
      epjfwdd5aufqssqem2qn1xzybapc8g4weggkzwytdt1v: [
        {
          chainId: 'solana',
          name: 'solana',
          tokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        },
      ],
    });
  });
});
describe('getMapOfLowestFeeTokensByChainId', () => {
  it('withdrawals skip - should be a map of chain ids to token information except for ETH USDC', () => {
    expect(getMapOfLowestFeeTokensByChainId(TransferType.withdrawal)).toEqual({
      43114: [
        {
          chainId: '43114',
          tokenAddress: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
          name: 'Avalanche',
        },
      ],
      10: [
        {
          chainId: '10',
          tokenAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
          name: 'optimism',
        },
      ],
      42161: [
        {
          chainId: '42161',
          tokenAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
          name: 'arbitrum',
        },
      ],
      8453: [
        {
          chainId: '8453',
          tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          name: 'Base',
        },
      ],
      137: [
        {
          chainId: '137',
          tokenAddress: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
          name: 'Polygon',
        },
      ],
      solana: [
        {
          chainId: 'solana',
          name: 'solana',
          tokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        },
      ],
    });
  });
  it('deposits skip - should be a map of chain ids to token information including ETH USDC', () => {
    expect(getMapOfLowestFeeTokensByChainId(TransferType.deposit)).toEqual({
      1: [
        {
          chainId: '1',
          tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          name: 'Ethereum',
        },
      ],
      43114: [
        {
          chainId: '43114',
          tokenAddress: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
          name: 'Avalanche',
        },
      ],
      10: [
        {
          chainId: '10',
          tokenAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
          name: 'optimism',
        },
      ],
      42161: [
        {
          chainId: '42161',
          tokenAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
          name: 'arbitrum',
        },
      ],
      8453: [
        {
          chainId: '8453',
          tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          name: 'Base',
        },
      ],
      137: [
        {
          chainId: '137',
          tokenAddress: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
          name: 'Polygon',
        },
      ],
      solana: [
        {
          chainId: 'solana',
          name: 'solana',
          tokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        },
      ],
    });
  });
});

describe('getMapOfHighestFeeTokensByChainId', () => {
  it('deposits skip - should be an empty map', () => {
    expect(getMapOfHighestFeeTokensByChainId(TransferType.deposit)).toEqual({});
  });
  it('withdrawals skip - should be a map with one property: ethereum chain id', () => {
    expect(getMapOfHighestFeeTokensByChainId(TransferType.withdrawal)).toEqual({
      1: [
        {
          chainId: '1',
          tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          name: 'Ethereum',
        },
      ],
    });
  });
});

describe('isTokenCctp', () => {
  const getTestAssetWithDenom = (denom: string) => ({
    denom,
    chainID: '1',
    originDenom: denom,
    originChainID: '1',
    trace: 'test-trace',
    isCW20: false,
    isEVM: true,
    isSVM: false,
    symbol: 'test-symbol',
    name: 'test-name',
    logoURI: 'test-logoURI',
    decimals: 10,
    tokenContract: 'test-contract',
    description: 'test-description',
    coingeckoID: 'test-coingeckoID',
    recommendedSymbol: 'test-recommendedSymbol',
  });
  it('returns true for cctp token', () => {
    const denom = cctpTokens[0]!.tokenAddress;
    const asset = getTestAssetWithDenom(denom);
    expect(isTokenCctp(asset)).toBe(true);
  });
  it('returns true for cctp token case insensitive', () => {
    const denom = cctpTokens[0]!.tokenAddress.toLowerCase();
    const asset = getTestAssetWithDenom(denom);
    expect(isTokenCctp(asset)).toBe(true);
  });
  it('returns false for non-cctp tokens', () => {
    const denom = 'non-cctp-denom';
    const asset = getTestAssetWithDenom(denom);
    expect(isTokenCctp(asset)).toBe(false);
  });
});
