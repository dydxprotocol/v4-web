import type { FC, ReactNode } from 'react';
import { useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { type SubmitErrorHandler, useForm } from 'react-hook-form';
import { useRequiredContext } from '@/lib/useRequiredContext';
import type { OrderEntryFormModel } from '../models';
import { createOrderEntryFormSchema, nullOrderEntryForm } from '../models';
import {
  OrderEntryFormApiContext,
  type OrderEntryFormApiContextType,
} from './OrderEntryFormApiContext';
import { OrderEntryFormMetaContext } from './OrderEntryFormMetaContext';

export type OrderEntryFormApiContextProviderProps = {
  children: ReactNode;
  onSubmitSuccessful: (data: OrderEntryFormModel) => void;
  onSubmitFailure?: SubmitErrorHandler<OrderEntryFormModel>;
  skipValidation?: boolean;
};

export const OrderEntryFormApiContextProvider: FC<OrderEntryFormApiContextProviderProps> = ({
  children,
  onSubmitSuccessful,
  onSubmitFailure,
  skipValidation,
}) => {
  const meta = useRequiredContext(OrderEntryFormMetaContext);

  const form = useForm<OrderEntryFormModel>({
    defaultValues: nullOrderEntryForm,
    mode: 'all',
    reValidateMode: 'onChange',
    criteriaMode: 'all',
    ...(!skipValidation && {
      resolver: zodResolver(createOrderEntryFormSchema(meta)),
    }),
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
