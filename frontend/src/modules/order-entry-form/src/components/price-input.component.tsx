import { useController } from 'react-hook-form';
import { useRequiredContext } from '@/lib/use-required-context.hook';
import { OrderEntryFormApiContext, OrderEntryFormMetaContext } from '../contexts';
import * as styles from './price-input.css';

export function PriceInput() {
  const { control } = useRequiredContext(OrderEntryFormApiContext);
  const { quoteAssetName } = useRequiredContext(OrderEntryFormMetaContext);
  const { field, fieldState } = useController({ control, name: 'price' });

  return (
    <div css={styles.container}>
      <label css={styles.label}>Price</label>
      <div css={styles.inputWrapper}>
        <input {...field} type="text" placeholder="0" css={styles.input} />
        <span css={styles.suffix}>{quoteAssetName}</span>
      </div>
      {fieldState.error && <span css={styles.error}>{fieldState.error.message}</span>}
    </div>
  );
}
