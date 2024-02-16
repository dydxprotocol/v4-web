import { describe, expect, it } from 'vitest';

import { convertBech32Address } from '../addressUtils';

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
