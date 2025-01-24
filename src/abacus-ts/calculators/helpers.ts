import { PositionUniqueId } from '../types/summaryTypes';

export function getPositionUniqueId(marketId: string, subaccountNumber: number): PositionUniqueId {
  return `${marketId}-${subaccountNumber}` as PositionUniqueId;
}
