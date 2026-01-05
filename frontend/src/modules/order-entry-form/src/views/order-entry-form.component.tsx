import { useWatch } from 'react-hook-form';
import { useRequiredContext } from '@/lib/use-required-context.hook';
import {
  OrderExecutionSwitch,
  OrderModeSelect,
  OrderSideSwitch,
  OrderSummary,
  PriceInput,
  SizeInput,
  SubmitButton,
  TriggerPriceInput,
} from '../components';
import type {
  OrderEntryFormApiContextProviderProps,
  OrderEntryFormMetaContextType,
} from '../contexts';
import {
  OrderEntryFormApiContext,
  OrderEntryFormApiContextProvider,
  OrderEntryFormMetaContext,
} from '../contexts';

export interface OrderEntryFormProps
  extends OrderEntryFormMetaContextType,
    Omit<OrderEntryFormApiContextProviderProps, 'children'> {}

function OrderEntryFormContent() {
  const { control } = useRequiredContext(OrderEntryFormApiContext);
  const orderMode = useWatch({ control, name: 'orderMode' });
  const orderExecutionType = useWatch({ control, name: 'orderExecutionType' });

  const showTriggerPrice = orderMode === 'stops';
  const showPrice = orderExecutionType === 'limit';

  return (
    <>
      <OrderModeSelect />
      <OrderExecutionSwitch />
      <OrderSideSwitch />
      {showTriggerPrice && <TriggerPriceInput />}
      {showPrice && <PriceInput />}
      <SizeInput />
      <OrderSummary />
      <SubmitButton />
    </>
  );
}

export function OrderEntryForm(props: OrderEntryFormProps) {
  return (
    <OrderEntryFormMetaContext.Provider value={props}>
      <OrderEntryFormApiContextProvider
        onSubmitSuccessful={props.onSubmitSuccessful}
        onSubmitFailure={props.onSubmitFailure}
      >
        <OrderEntryFormContent />
      </OrderEntryFormApiContextProvider>
    </OrderEntryFormMetaContext.Provider>
  );
}
