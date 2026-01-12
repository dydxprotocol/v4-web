import { createContext } from 'react';
import { type Control } from 'react-hook-form';
import type { OrderEntryFormModel } from '../models';

export interface OrderEntryFormApiContextType {
  submitHandler: (e?: React.BaseSyntheticEvent) => Promise<void>;
  control: Control<OrderEntryFormModel>;
}

export const OrderEntryFormApiContext = createContext<OrderEntryFormApiContextType | null>(null);

OrderEntryFormApiContext.displayName = 'OrderEntryFormApiContext';
