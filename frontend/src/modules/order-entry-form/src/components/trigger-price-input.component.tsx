import { useController } from 'react-hook-form';
import { useRequiredContext } from '@/lib/use-required-context.hook';
import { OrderEntryFormApiContext, OrderEntryFormMetaContext } from '../contexts';
import * as styles from './trigger-price-input.css';

export function TriggerPriceInput() {
  const { quoteAssetName } = useRequiredContext(OrderEntryFormMetaContext);
  const { control } = useRequiredContext(OrderEntryFormApiContext);
  const { field, fieldState } = useController({ control, name: 'triggerPrice' });

  return (
    <div css={styles.container}>
      <label css={styles.label}>Trigger Price</label>
      <div css={styles.inputWrapper}>
        <input {...field} type="text" placeholder="0.00" css={styles.input} />
        <span css={styles.suffix}>{quoteAssetName}</span>
      </div>
      {fieldState.error && <span css={styles.error}>{fieldState.error.message}</span>}
    </div>
  );
}
