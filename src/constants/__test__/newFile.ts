import { expect } from 'vitest';

import { getLowestFeeChainNames } from '../cctp';

describe('cctp constants', () => {
  it('should export all non eth cctp mainnet chain names as an array', () => {
    expect(getLowestFeeChainNames).toEqual('Avalanche, Optimism, Arbitrum, Base, Polygon');
  });
});
