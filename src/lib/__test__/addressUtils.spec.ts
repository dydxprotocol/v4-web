import { describe, expect, it } from 'vitest';

import { convertBech32Address, validateInjectiveAddress } from '../addressUtils';

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

describe('validateInjectiveAddress', () => {
  it('accepts a valid Injective address', () => {
    expect(validateInjectiveAddress('inj12x0u5s87v0f9p2pmaamh8fwraxsnugwgkk2qvy')).toBe(true);
  });
  it('rejects addresses with other prefixes', () => {
    expect(validateInjectiveAddress('osmo1vuedm6696nqmst4v73lchmx9vv3aw6c4768ev9')).toBe(false);
    expect(validateInjectiveAddress('dydx107a68slrkxayftz7vntyaxw6tk8xmcankv3clc')).toBe(false);
  });
  it('rejects inj addresses that are not 20 bytes', () => {
    expect(
      validateInjectiveAddress('inj1qqqsyqcyq5rqwzqfpg9scrgwpugpzysnzs23v9ccrydpk8qarc0sax6t9f')
    ).toBe(false);
  });
  it('rejects malformed input', () => {
    expect(validateInjectiveAddress('inj12x0u5s87v0f9p2pmaamh8fwraxsnugwgkk2qvz')).toBe(false);
    expect(validateInjectiveAddress('')).toBe(false);
    expect(validateInjectiveAddress('0x51990c8c8f7cd12b7ed8a9d3c2e5c6d9e3f36d07')).toBe(false);
  });
});
