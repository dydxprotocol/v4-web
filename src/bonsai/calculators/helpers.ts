import { AttemptNumber } from '@/lib/numbers';

import { PositionUniqueId } from '../types/summaryTypes';

export function getPositionUniqueId(marketId: string, subaccountNumber: number): PositionUniqueId {
  return `${marketId}-${subaccountNumber}` as PositionUniqueId;
}

export function getPositionUniqueIdComponents(id: PositionUniqueId):
  | {
      marketId: string;
      subaccountNumber: number;
    }
  | undefined {
  const pieces = id.split('-');
  if (pieces.length <= 1) {
    return undefined;
  }

  const subaccountNumber = AttemptNumber(pieces.at(-1));
  if (subaccountNumber == null) {
    return undefined;
  }

  return { subaccountNumber, marketId: pieces.slice(0, -1).join('-') };
}
