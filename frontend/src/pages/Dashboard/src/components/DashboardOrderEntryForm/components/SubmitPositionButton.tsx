import type { FC } from 'react';
import { useMemo } from 'react';
import { getPositionSide } from 'fuel-ts-sdk/trading';
import { useFormState, useWatch } from 'react-hook-form';
import { WalletContext } from '@/contexts/WalletContext';
import { useSdkQuery, useTradingSdk } from '@/lib/fuel-ts-sdk';
import { useAwaited } from '@/lib/useAwaited';
import { useRequiredContext } from '@/lib/useRequiredContext';
import { OrderEntryFormApiContext } from '@/modules/OrderEntryForm';
import * as $ from './SubmitPositionButton.css';

export const SubmitPositionButton: FC = () => {
  const tradingSdk = useTradingSdk();
  const wallet = useRequiredContext(WalletContext);
  const { control, submitHandler } = useRequiredContext(OrderEntryFormApiContext);
  const orderSide = useWatch({ control, name: 'orderSide' });

  const formState = useFormState({ control });

  const userAddress = useAwaited(useMemo(() => wallet.getUserAddress(), [wallet]));

  const hasPositions = useSdkQuery(
    () =>
      tradingSdk
        .getAccountWatchedAssetPositions(userAddress)
        .filter((p) => getPositionSide(p) === orderSide.toUpperCase()).length > 0
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
