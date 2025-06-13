import { ReactNode } from 'react';

import { SubaccountPosition } from '../bonsai/types/summaryTypes';
import type { MarketData } from './markets';

export type CustomItem = {
  itemType: 'custom';
  item: ReactNode;
};

export type PositionItem = {
  itemType: 'position';
  item: SubaccountPosition;
};

export type HeaderItem = {
  itemType: 'header';
  item: string;
  slotLeft?: ReactNode;
  slotRight?: ReactNode;
  slotBottom?: ReactNode;
};

export type MarketItem = {
  itemType: 'market';
  item: MarketData;
};

export type ListItem = (PositionItem | HeaderItem | MarketItem | CustomItem) & {
  isSticky?: boolean;
  customHeight?: number;
};

export enum MarketsSortType {
  MarketCap = 'market-cap',
  Volume = 'volume',
  Gainers = 'gainers',
  Losers = 'losers',
  Favorites = 'favorites',
}

export enum PositionSortType {
  Price = 'price',
  Notional = 'notional',
  Pnl = 'pnl',
  Leverage = 'leverage',
}
