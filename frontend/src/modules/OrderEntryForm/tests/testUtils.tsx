import type { ReactNode } from 'react';
import { signal } from '@preact/signals-react';
import type { OrderEntryFormMetaContextType } from '../src/contexts';
import { OrderEntryFormApiContextProvider, OrderEntryFormMetaContext } from '../src/contexts';

const defaultMockContext: OrderEntryFormMetaContextType = {
  quoteAssetName: 'USD',
  userBalanceInBaseAsset: 0.5,
  currentQuoteAssetPrice: signal(50000),
  currentBaseAssetPrice: signal(50000),
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
