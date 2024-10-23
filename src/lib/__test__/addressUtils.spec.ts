import { NOBLE_BECH32_PREFIX } from '@dydxprotocol/v4-client-js';
import { describe, expect, it } from 'vitest';

import { NEUTRON_BECH32_PREFIX, OSMO_BECH32_PREFIX } from '@/constants/graz';

import { convertBech32Address, isValidAddress } from '../addressUtils';

describe('convertBech32Address', () => {
  const AXELAR_ADDRESS = 'axelar1vuedm6696nqmst4v73lchmx9vv3aw6c4j0zp3k';
  const OSMOSIS_ADDRESS = 'osmo1vuedm6696nqmst4v73lchmx9vv3aw6c4768ev9';
  const COSMOS_ADDRESS = 'cosmos1vuedm6696nqmst4v73lchmx9vv3aw6c4kp5f6h';

  it('can derive Osmosis Address from Cosmos Address', () => {
    expect(convertBech32Address({ address: COSMOS_ADDRESS, bech32Prefix: 'osmo' })).toEqual(
      OSMOSIS_ADDRESS
    );
  });
  it('can derive Axelar Address from Cosmos Address', () => {
    expect(convertBech32Address({ address: COSMOS_ADDRESS, bech32Prefix: 'axelar' })).toEqual(
      AXELAR_ADDRESS
    );
  });
  it('can derive Cosmos Address from Osmosis Address', () => {
    expect(convertBech32Address({ address: OSMOSIS_ADDRESS, bech32Prefix: 'cosmos' })).toEqual(
      COSMOS_ADDRESS
    );
  });
  it('can derive Cosmos Address from Axelar Address', () => {
    expect(convertBech32Address({ address: AXELAR_ADDRESS, bech32Prefix: 'cosmos' })).toEqual(
      COSMOS_ADDRESS
    );
  });
});

const EVM_ADDRESS = '0x0f7833777bfC9ef72D8B76AE954D3849DD71F829';
const SVM_ADDRESS = '7AFKEVD1Q2wWTG78w7UEQcQs6Bvpt7SCRSytCgUknbnr';
const COSMOS_ADDRESS = 'dydx1nhzuazjhyfu474er6v4ey8zn6wa5fy6g2dgp7s';
describe('isValidAddress', () => {
  it('returns false for no missing address', () => {
    expect(isValidAddress({ network: 'evm' })).toBe(false);
  });
  it('returns false for evm network with non evm addresses', () => {
    [SVM_ADDRESS, COSMOS_ADDRESS].forEach((address) => {
      expect(isValidAddress({ network: 'evm', address })).toBe(false);
    });
  });
  it('returns false for svm network with non svm addresses', () => {
    [EVM_ADDRESS, COSMOS_ADDRESS].forEach((address) => {
      expect(isValidAddress({ network: 'solana', address })).toBe(false);
    });
  });
  it('returns false for cosmos network with non cosmos addresses', () => {
    [SVM_ADDRESS, EVM_ADDRESS].forEach((address) => {
      expect(isValidAddress({ network: 'cosmos', address, prefix: 'dydx' })).toBe(false);
    });
  });
  it('returns false for cosmos network with incorrectly prefixed cosmos addresses', () => {
    [NOBLE_BECH32_PREFIX, OSMO_BECH32_PREFIX, NEUTRON_BECH32_PREFIX].forEach((address) => {
      expect(isValidAddress({ network: 'cosmos', address, prefix: 'dydx' })).toBe(false);
    });
  });
  // TODO: figure out why viem throws 'expected uint8Array, got object' error in test env
  // it('returns true for evm network with evm address', () => {
  // expect(isValidAddress({ network: 'evm', address: EVM_ADDRESS })).toBe(true);
  // });
  it('returns true for svm network with svm address', () => {
    expect(isValidAddress({ network: 'solana', address: SVM_ADDRESS })).toBe(true);
  });
  it('returns true for cosmos network with cosmos addresses', () => {
    expect(isValidAddress({ network: 'cosmos', address: COSMOS_ADDRESS, prefix: 'dydx' })).toBe(
      true
    );
  });
});
