import { createContext } from 'react';

export type OrderEntryFormMetaContextType = {
  baseAssetName: string;
  quoteAssetName: string;

  userBalanceInQuoteAsset: number;
  userBalanceInBaseAsset: number;

  currentQuoteAssetPrice: number;
};

export const OrderEntryFormMetaContext = createContext<OrderEntryFormMetaContextType | null>(null);

OrderEntryFormMetaContext.displayName = 'OrderEntryFormMeta';
