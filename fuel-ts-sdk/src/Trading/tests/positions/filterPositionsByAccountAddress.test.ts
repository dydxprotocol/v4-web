import { address, positionStableId } from '@sdk/shared/types';
import { describe, expect, it } from 'vitest';
import { filterPositionsByAccountAddress } from '../../src/Positions/domain/calculations/filterPositionsByAccountAddress';
import { createMinimalPosition } from './helpers/createMinimalPosition';

describe('filterPositionsByAccountAddress', () => {
  const account1 = address('0x1111111111111111111111111111111111111111111111111111111111111111');
  const account2 = address('0x2222222222222222222222222222222222222222222222222222222222222222');

  it('should filter positions by account address', () => {
    const positions = [
      {
        ...createMinimalPosition({ stableId: positionStableId('pos-1') }),
        accountAddress: account1,
      },
      {
        ...createMinimalPosition({ stableId: positionStableId('pos-2') }),
        accountAddress: account2,
      },
      {
        ...createMinimalPosition({ stableId: positionStableId('pos-3') }),
        accountAddress: account1,
      },
    ];

    const filtered = filterPositionsByAccountAddress(positions, account1);

    expect(filtered).toHaveLength(2);
    expect(filtered.map((p) => p.stableId)).toEqual(['pos-1', 'pos-3']);
  });

  it('should return empty array when no positions match', () => {
    const positions = [
      {
        ...createMinimalPosition({ stableId: positionStableId('pos-1') }),
        accountAddress: account1,
      },
      {
        ...createMinimalPosition({ stableId: positionStableId('pos-2') }),
        accountAddress: account1,
      },
    ];

    const filtered = filterPositionsByAccountAddress(positions, account2);

    expect(filtered).toHaveLength(0);
  });

  it('should return empty array when positions array is empty', () => {
    const filtered = filterPositionsByAccountAddress([], account1);

    expect(filtered).toHaveLength(0);
  });

  it('should return all positions when all belong to the account', () => {
    const positions = [
      {
        ...createMinimalPosition({ stableId: positionStableId('pos-1') }),
        accountAddress: account1,
      },
      {
        ...createMinimalPosition({ stableId: positionStableId('pos-2') }),
        accountAddress: account1,
      },
      {
        ...createMinimalPosition({ stableId: positionStableId('pos-3') }),
        accountAddress: account1,
      },
    ];

    const filtered = filterPositionsByAccountAddress(positions, account1);

    expect(filtered).toHaveLength(3);
  });
});
