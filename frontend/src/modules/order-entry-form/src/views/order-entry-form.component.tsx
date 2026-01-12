import { OrderSideSwitch, SubmitButton } from '../components';
import { LeverageInput } from '../components/leverage-input';
import { PositionSizeInputs } from '../components/position-size-inputs/position-size-inputs.component';
import type {
  OrderEntryFormApiContextProviderProps,
  OrderEntryFormMetaContextType,
} from '../contexts';
import { OrderEntryFormApiContextProvider, OrderEntryFormMetaContext } from '../contexts';

export interface OrderEntryFormProps
  extends OrderEntryFormMetaContextType,
    Omit<OrderEntryFormApiContextProviderProps, 'children'> {}

function OrderEntryFormContent() {
  return (
    <>
      <OrderSideSwitch />
      <PositionSizeInputs />
      <LeverageInput />
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
