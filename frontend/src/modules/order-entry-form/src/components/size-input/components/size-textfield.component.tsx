import type { FC } from 'react';
import { useController, useWatch } from 'react-hook-form';
import { useRequiredContext } from '@/lib/use-required-context.hook';
import { OrderEntryFormApiContext, OrderEntryFormMetaContext } from '../../../contexts';
import * as styles from './size-textfield.css';

export const SizeTextfield: FC = () => {
  const { userBalanceInQuoteAsset, userBalanceInBaseAsset, quoteAssetName, baseAssetName } =
    useRequiredContext(OrderEntryFormMetaContext);
  const { control } = useRequiredContext(OrderEntryFormApiContext);

  const { field, fieldState } = useController({ control, name: 'positionSize' });
  const currentOrderSide = useWatch({ control, name: 'orderSide' });

  const userBalanceInTargetAsset =
    currentOrderSide === 'buy' ? userBalanceInQuoteAsset : userBalanceInBaseAsset;
  const targetAssetName = currentOrderSide === 'buy' ? quoteAssetName : baseAssetName;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    field.onChange(e.target.value);
  };

  return (
    <>
      <label css={styles.label}>
        Size
        <span css={styles.balanceLabel}>
          Balance: {userBalanceInTargetAsset} {targetAssetName}
        </span>
      </label>
      <div css={styles.inputWrapper}>
        <input
          value={field.value}
          onChange={handleInputChange}
          onBlur={field.onBlur}
          name={field.name}
          type="text"
          placeholder="0.00"
          css={styles.input}
        />
        <span css={styles.suffix}>{baseAssetName}</span>
      </div>
      {fieldState.error && <span css={styles.error}>{fieldState.error.message}</span>}
    </>
  );
};
