import {
  IndexerAssetPositionResponseObject,
  IndexerHistoricalBlockTradingReward,
  IndexerPerpetualMarketResponseObject,
  IndexerPerpetualPositionResponseObject,
  IndexerTransferResponseObject,
} from '@/types/indexer/indexerApiGen';
import {
  IndexerCompositeFillObject,
  IndexerCompositeOrderObject,
} from '@/types/indexer/indexerManual';

export type MarketsData = { [marketId: string]: IndexerPerpetualMarketResponseObject };
export type OrdersData = { [orderId: string]: IndexerCompositeOrderObject };

export type OrderbookData = {
  bids: { [price: string]: string };
  asks: { [price: string]: string };
};

export interface ParentSubaccountData {
  address: string;
  parentSubaccount: number;

  childSubaccounts: { [subaccountNumber: string]: ChildSubaccountData | undefined };

  // this data is lost on websocket reconnect, should never be trusted as the ONLY source for this information
  // it should be used to trigger a rest call refresh (debounced) and merged with the rest call result until the refresh completes
  ephemeral: {
    tradingRewards?: IndexerHistoricalBlockTradingReward[];
    fills?: IndexerCompositeFillObject[];
    orders?: OrdersData;
    transfers?: IndexerTransferResponseObject[];
  };
}

export interface ChildSubaccountData {
  address: string;

  subaccountNumber: number;

  openPerpetualPositions: { [market: string]: IndexerPerpetualPositionResponseObject };

  assetPositions: { [symbol: string]: IndexerAssetPositionResponseObject };
}
