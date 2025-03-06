import {
  IndexerPositionSide,
  IndexerSubaccountResponseObject,
} from '@/types/indexer/indexerApiGen';

import { getSimpleOrderStatus as getSimpleOrderStatusInner } from '../calculators/orders';
import { ChildSubaccountData } from '../types/rawTypes';

export function isValidSubaccount(childSubaccount: IndexerSubaccountResponseObject) {
  return (
    Object.keys(childSubaccount.assetPositions).length > 0 ||
    Object.keys(childSubaccount.openPerpetualPositions).length > 0
  );
}

export function convertToStoredChildSubaccount({
  address,
  subaccountNumber,
  assetPositions,
  openPerpetualPositions,
}: IndexerSubaccountResponseObject): ChildSubaccountData {
  return {
    address,
    subaccountNumber,
    assetPositions,
    openPerpetualPositions,
  };
}

export function freshChildSubaccount({
  address,
  subaccountNumber,
}: {
  address: string;
  subaccountNumber: number;
}): ChildSubaccountData {
  return {
    address,
    subaccountNumber,
    assetPositions: {},
    openPerpetualPositions: {},
  };
}

export function newUsdcAssetPosition({
  side,
  size,
  subaccountNumber,
}: {
  side: IndexerPositionSide;
  size: string;
  subaccountNumber: number;
}) {
  return {
    assetId: '0',
    size,
    subaccountNumber,
    side,
    symbol: 'USDC',
  };
}

export const getSimpleOrderStatus = getSimpleOrderStatusInner;
