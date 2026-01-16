import { useFormState, useWatch } from 'react-hook-form';
import { useRequiredContext } from '@/lib/useRequiredContext';
import { OrderEntryFormApiContext } from '../contexts';
import * as styles from './SubmitButton.css';

export function SubmitButton() {
  const { control, submitHandler } = useRequiredContext(OrderEntryFormApiContext);
  const orderSide = useWatch({ control, name: 'orderSide' });

  const formState = useFormState({ control });

  return (
    <button
      type="button"
      css={[
        styles.button,
        orderSide === 'long' ? styles.buyButton : styles.sellButton,
        !formState.isValid && styles.disabledButton,
      ]}
      onClick={submitHandler}
    >
      Open Position
    </button>
  );
}
