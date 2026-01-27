import type { Address } from '@sdk/shared/types';
import type { PositionEntity } from '../PositionsEntity';

export function filterPositionsByAccountAddress(
  positions: PositionEntity[],
  accountAddress: Address
) {
  return positions.filter((p) => p.accountAddress === accountAddress);
}
