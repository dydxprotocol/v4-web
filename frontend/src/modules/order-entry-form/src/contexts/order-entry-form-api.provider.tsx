import type { FC, ReactNode } from 'react';
import { useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { type SubmitErrorHandler, useForm } from 'react-hook-form';
import type { OrderEntryFormModel } from '../models';
import { createOrderEntryFormSchema, nullOrderEntryForm } from '../models';
import {
  OrderEntryFormApiContext,
  type OrderEntryFormApiContextType,
} from './order-entry-form-api.context';

export type OrderEntryFormApiContextProviderProps = {
  children: ReactNode;
  onSubmitSuccessful: (data: OrderEntryFormModel) => void;
  onSubmitFailure?: SubmitErrorHandler<OrderEntryFormModel>;
};

export const OrderEntryFormApiContextProvider: FC<OrderEntryFormApiContextProviderProps> = ({
  children,
  onSubmitSuccessful,
  onSubmitFailure,
}) => {
  const form = useForm<OrderEntryFormModel>({
    defaultValues: nullOrderEntryForm,
    resolver: zodResolver(createOrderEntryFormSchema()),
    mode: 'all',
    reValidateMode: 'onChange',
    criteriaMode: 'all',
  });

  const contextValue = useMemo<OrderEntryFormApiContextType>(
    () => ({
      submitHandler: form.handleSubmit(onSubmitSuccessful, onSubmitFailure),
      control: form.control,
    }),
    [form, onSubmitFailure, onSubmitSuccessful]
  );

  return (
    <OrderEntryFormApiContext.Provider value={contextValue}>
      {children}
    </OrderEntryFormApiContext.Provider>
  );
};
