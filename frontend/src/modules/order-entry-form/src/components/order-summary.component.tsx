import { useWatch } from 'react-hook-form';
import { useRequiredContext } from '@/lib/use-required-context.hook';
import { OrderEntryFormApiContext } from '../contexts';
import { OrderEntryFormMetaContext } from '../contexts/order-entry-form-meta.context';
import * as styles from './order-summary.css';

export function OrderSummary() {
  const { control } = useRequiredContext(OrderEntryFormApiContext);
  const { baseAssetName, quoteAssetName } = useRequiredContext(OrderEntryFormMetaContext);

  const orderSide = useWatch({ control, name: 'orderSide' });
  const price = useWatch({ control, name: 'price' });
  const size = useWatch({ control, name: 'positionSize' });

  const priceValue = parseFloat(price || '0');
  const sizeValue = parseFloat(size || '0');
  const orderPrice = priceValue * sizeValue;

  return (
    <div css={styles.container}>
      <div css={styles.row}>
        <span css={[styles.label, orderSide === 'buy' ? styles.buyLabel : styles.sellLabel]}>
          {orderSide.toUpperCase()}
        </span>
        <span css={styles.label}>Order Price:</span>
      </div>
      <div css={styles.row}>
        <span css={styles.value}>
          {orderPrice.toFixed(2)} {quoteAssetName}
        </span>
      </div>
      <div css={styles.fees}>
        <span css={styles.feesLabel}>Fees:</span>
        <span css={styles.feesLink}>VIEW MY FEES</span>
      </div>
      <div css={styles.links}>
        <span css={styles.link}>{orderSide === 'buy' ? baseAssetName : quoteAssetName} INFO</span>
        <span css={styles.separator}>|</span>
        <span css={styles.link}>VIEW ALL PRICES</span>
      </div>
    </div>
  );
}
