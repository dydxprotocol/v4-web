import type { ReactNode } from 'react';
import type { OrderEntryFormMetaContextType } from '../src/contexts';
import { OrderEntryFormApiContextProvider, OrderEntryFormMetaContext } from '../src/contexts';

const defaultMockContext: OrderEntryFormMetaContextType = {
  baseAssetName: 'BTC',
  quoteAssetName: 'USD',
  userBalanceInQuoteAsset: 10000,
  userBalanceInBaseAsset: 0.5,
  currentQuoteAssetPrice: 50000,
};

export function OrderEntryFormTestWrapper({
  children,
  context = defaultMockContext,
  onSubmitSuccessful = () => {},
  onSubmitFailure = () => {},
}: {
  children: ReactNode;
  context?: OrderEntryFormMetaContextType;
  onSubmitSuccessful?: (data: any) => void;
  onSubmitFailure?: (errors: any) => void;
}) {
  return (
    <OrderEntryFormMetaContext.Provider value={context}>
      <OrderEntryFormApiContextProvider
        onSubmitSuccessful={onSubmitSuccessful}
        onSubmitFailure={onSubmitFailure}
      >
        {children}
      </OrderEntryFormApiContextProvider>
    </OrderEntryFormMetaContext.Provider>
  );
}
