import { createContext } from 'react';
import type { Signal } from '@preact/signals-react';

export type OrderEntryFormMetaContextType = {
  // Asset information
  quoteAssetName: string;

  // User balances
  userBalanceInBaseAsset: number;

  // Current prices (reactive signals)
  currentQuoteAssetPrice: Signal<number>;
  currentBaseAssetPrice: Signal<number>;

  // Market configuration (optional - for perpetuals validation)
  maxLeverage?: number;
  minCollateral?: number;
  minPositionSize?: number;
  maxPositionSize?: number;
  maxPriceDeviation?: number;
  initialMarginFraction?: number; // Used to calculate max leverage (1/IMF)
  maintenanceMarginFraction?: number; // Used to calculate liquidation price

  // Validation flags
  warnHighLeverage?: boolean;
};

export const OrderEntryFormMetaContext = createContext<OrderEntryFormMetaContextType | null>(null);

OrderEntryFormMetaContext.displayName = 'OrderEntryFormMeta';
