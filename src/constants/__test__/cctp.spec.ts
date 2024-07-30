import { describe, expect, it } from 'vitest';

import {
  getLowestFeeChainNames,
  getMapOfHighestFeeTokensByChainId,
  getMapOfLowestFeeTokensByChainId,
  getMapOfLowestFeeTokensByDenom,
} from '@/constants/cctp';

import { TransferType } from '../abacus';

describe('getLowestFeeChainNames', () => {
  it('withdrawals skip - returns non eth cctp mainnet chain names as an array', () => {
    expect(getLowestFeeChainNames(TransferType.withdrawal, true)).toEqual([
      'Avalanche',
      'Optimism',
      'Arbitrum',
    ]);
  });
  it('deposits skip - returns all cctp mainnet chain names as an array', () => {
    expect(getLowestFeeChainNames(TransferType.deposit, true)).toEqual([
      'Ethereum',
      'Avalanche',
      'Optimism',
      'Arbitrum',
    ]);
  });
  it('withdrawals squid - returns all cctp mainnet chain names as an array', () => {
    expect(getLowestFeeChainNames(TransferType.withdrawal, false)).toEqual([
      'Ethereum',
      'Avalanche',
      'Optimism',
      'Arbitrum',
    ]);
  });
  it('deposits squid - returns all cctp mainnet chain names as an array', () => {
    expect(getLowestFeeChainNames(TransferType.deposit, false)).toEqual([
      'Ethereum',
      'Avalanche',
      'Optimism',
      'Arbitrum',
    ]);
  });
});

describe('getMapOfLowestFeeTokensByDenom', () => {
  it('withdrawals skip - returns a map of token denom/addresses to token information except for ETH USDC', () => {
    expect(getMapOfLowestFeeTokensByDenom(TransferType.withdrawal, true)).toEqual({
      '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E': [
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
      '0xaf88d065e77c8cC2239327C5EDb3A432268e5831': [
        {
          chainId: '42161',
          tokenAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
          name: 'arbitrum',
        },
      ],
    });
  });
  it('deposits skip - returns a map of token denom/addresses to token information including ETH USDC', () => {
    expect(getMapOfLowestFeeTokensByDenom(TransferType.deposit, true)).toEqual({
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': [
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
      '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85': [
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
    });
  });
  it('withdrawals squid - returns a map of token denom/addresses to token information including ETH USDC', () => {
    expect(getMapOfLowestFeeTokensByDenom(TransferType.withdrawal, false)).toEqual({
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': [
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
      '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85': [
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
    });
  });
  it('deposits squid - returns a map of token denom/addresses to token information including ETH USDC', () => {
    expect(getMapOfLowestFeeTokensByDenom(TransferType.deposit, false)).toEqual({
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': [
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
      '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85': [
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
    });
  });
});
describe('getMapOfLowestFeeTokensByChainId', () => {
  it('withdrawals skip - should be a map of chain ids to token information except for ETH USDC', () => {
    expect(getMapOfLowestFeeTokensByChainId(TransferType.withdrawal, true)).toEqual({
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
    });
  });
  it('deposits skip - should be a map of chain ids to token information including ETH USDC', () => {
    expect(getMapOfLowestFeeTokensByChainId(TransferType.deposit, true)).toEqual({
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
    });
  });
  it('withdrawals squid - should be a map of chain ids to token information including ETH USDC', () => {
    expect(getMapOfLowestFeeTokensByChainId(TransferType.withdrawal, false)).toEqual({
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
    });
  });
  it('deposits squid - should be a map of chain ids to token information including ETH USDC', () => {
    expect(getMapOfLowestFeeTokensByChainId(TransferType.deposit, false)).toEqual({
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
    });
  });
});

describe('getMapOfHighestFeeTokensByChainId', () => {
  it('deposits squid - should be an empty map', () => {
    expect(getMapOfHighestFeeTokensByChainId(TransferType.deposit, false)).toEqual({});
  });
  it('deposits skip - should be an empty map', () => {
    expect(getMapOfHighestFeeTokensByChainId(TransferType.deposit, true)).toEqual({});
  });
  it('withdrawals squid - should be an empty map', () => {
    expect(getMapOfHighestFeeTokensByChainId(TransferType.withdrawal, false)).toEqual({});
  });
  it('withdrawals skip - should be a map with one property: ethereum chain id', () => {
    expect(getMapOfHighestFeeTokensByChainId(TransferType.withdrawal, true)).toEqual({
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
