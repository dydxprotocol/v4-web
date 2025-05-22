import { pickBy } from 'lodash';

import { NUM_PARENT_SUBACCOUNTS } from '@/constants/account';
import {
  IndexerPerpetualPositionStatus,
  IndexerPositionSide,
  IndexerSubaccountResponseObject,
} from '@/types/indexer/indexerApiGen';

import { BigNumberish, MustBigNumber } from '@/lib/numbers';

import { getSimpleOrderStatus as getSimpleOrderStatusInner } from '../calculators/orders';
import { ChildSubaccountData } from '../types/rawTypes';

export function isValidSubaccount(childSubaccount: IndexerSubaccountResponseObject) {
  return (
    Object.keys(childSubaccount.assetPositions).length > 0 ||
    Object.keys(childSubaccount.openPerpetualPositions).length > 0
  );
}

export function isParentSubaccount(subaccountNumber: BigNumberish): boolean {
  return MustBigNumber(subaccountNumber).lt(NUM_PARENT_SUBACCOUNTS);
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
    openPerpetualPositions: pickBy(
      openPerpetualPositions,
      (p) => p.status === IndexerPerpetualPositionStatus.OPEN
    ),
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
