import { createContext } from 'react';
import { type Control, type FormState } from 'react-hook-form';
import type { OrderEntryFormModel } from '../models';

export interface OrderEntryFormApiContextType {
  submitHandler: (e?: React.BaseSyntheticEvent) => Promise<void>;
  control: Control<OrderEntryFormModel>;
  formState: FormState<OrderEntryFormModel>;
}

export const OrderEntryFormApiContext = createContext<OrderEntryFormApiContextType | null>(null);

OrderEntryFormApiContext.displayName = 'OrderEntryFormApiContext';
