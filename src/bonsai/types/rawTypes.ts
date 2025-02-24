import { MetadataServiceAssetInfo, MetadataServicePrice } from '@/constants/assetMetadata';
import {
  IndexerAssetPositionResponseObject,
  IndexerHistoricalBlockTradingReward,
  IndexerPerpetualPositionResponseObject,
} from '@/types/indexer/indexerApiGen';
import {
  IndexerCompositeFillObject,
  IndexerCompositeOrderObject,
  IndexerTransferCommonResponseObject,
  IndexerWsBaseMarketObject,
} from '@/types/indexer/indexerManual';

export type MarketsData = { [marketId: string]: IndexerWsBaseMarketObject };
export type OrdersData = { [orderId: string]: IndexerCompositeOrderObject };

export type OrderbookData = {
  bids: { [price: string]: { size: string; offset: number } };
  asks: { [price: string]: { size: string; offset: number } };
};

export interface ParentSubaccountData {
  address: string;
  parentSubaccount: number;

  childSubaccounts: { [subaccountNumber: string]: ChildSubaccountData | undefined };

  // this data is lost on websocket reconnect, should never be trusted as the ONLY source for this information
  // it should be used to trigger a rest call refresh (debounced) and merged with the rest call result until the refresh completes
  live: {
    tradingRewards?: IndexerHistoricalBlockTradingReward[];
    fills?: IndexerCompositeFillObject[];
    orders?: OrdersData;
    transfers?: IndexerTransferCommonResponseObject[];
  };
}

export type ParentSubaccountDataBase = Omit<ParentSubaccountData, 'live'>;

export interface ChildSubaccountData {
  address: string;

  subaccountNumber: number;

  openPerpetualPositions: { [market: string]: IndexerPerpetualPositionResponseObject };

  assetPositions: { [symbol: string]: IndexerAssetPositionResponseObject };
}

export type AssetInfo = MetadataServiceAssetInfo & MetadataServicePrice & { id: string };
export type AssetInfos = Record<string, AssetInfo>;
