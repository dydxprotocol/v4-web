import type { FC } from 'react';
import { useFormState, useWatch } from 'react-hook-form';
import { useSdkQuery, useTradingSdk } from '@/lib/fuel-ts-sdk';
import { useRequiredContext } from '@/lib/useRequiredContext';
import { OrderEntryFormApiContext } from '@/modules/OrderEntryForm';
import * as $ from './SubmitPositionButton.css';

export const SubmitPositionButton: FC = () => {
  const tradingSdk = useTradingSdk();
  const { control, submitHandler } = useRequiredContext(OrderEntryFormApiContext);
  const orderSide = useWatch({ control, name: 'orderSide' });

  const formState = useFormState({ control });

  const hasPositions = useSdkQuery(
    () =>
      tradingSdk.getCurrentAccountOpenPositions().filter((p) => p.side === orderSide.toUpperCase())
        .length > 0
  );

  return (
    <button
      type="button"
      css={[
        $.button,
        orderSide === 'long' ? $.buyButton : $.sellButton,
        !formState.isValid && $.disabledButton,
      ]}
      onClick={submitHandler}
    >
      {hasPositions ? 'Increase Position' : 'Open Position'}
    </button>
  );
};
