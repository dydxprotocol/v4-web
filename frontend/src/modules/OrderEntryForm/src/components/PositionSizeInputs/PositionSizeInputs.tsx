import { type FC, useCallback, useEffect, useMemo, useState } from 'react';
import { $decimalValue, DecimalCalculator, DecimalValue } from 'fuel-ts-sdk';
import { useController, useWatch } from 'react-hook-form';
import { useRequiredContext } from '@/lib/useRequiredContext';
import { OrderEntryFormApiContext, OrderEntryFormMetaContext } from '../../contexts';
import type { OrderEntryFormModel } from '../../models';
import { AssetSizeInput } from './components/asset-size-input.component';

export const PositionSizeInputs: FC = () => {
  const { control } = useRequiredContext(OrderEntryFormApiContext);
  const { currentQuoteAssetPrice, currentBaseAssetPrice, quoteAssetName } =
    useRequiredContext(OrderEntryFormMetaContext);
  const collateralSize = useController({ control, name: 'collateralSize' });
  const positionSize = useController({ control, name: 'positionSize' });
  const leverage = useWatch({ control, name: 'leverage', compute: (v) => +(v ?? 10) });
  const orderSide = useWatch({ control, name: 'orderSide' });

  const [focusedField, setFocusedField] = useState<keyof OrderEntryFormModel>();

  const baseAssetUsdValue = useMemo(
    () => +(collateralSize.field.value ?? 0) * currentBaseAssetPrice.value,
    [collateralSize.field.value, currentBaseAssetPrice.value]
  );
  const quoteAssetUsdValue = useMemo(
    () => +(positionSize.field.value ?? 0) * currentQuoteAssetPrice.value,
    [currentQuoteAssetPrice.value, positionSize.field.value]
  );

  const updateCollateralSize = useCallback(
    (val: string) => {
      if (isNaN(+val)) return;
      collateralSize.field.onChange(String(val));
    },
    [collateralSize.field]
  );
  const updatePositionSize = useCallback(
    (val: string) => {
      if (isNaN(+val)) return;
      positionSize.field.onChange(String(val));
    },
    [positionSize.field]
  );

  useEffect(() => {
    if (!positionSize.field.value && !collateralSize.field.value) return;
    const leverageDv = DecimalValue.fromFloat(leverage);
    const quoteAssetPriceDv = DecimalValue.fromFloat(currentQuoteAssetPrice.value);

    if (focusedField === 'collateralSize') {
      const sizeDv = DecimalValue.fromDecimalString(collateralSize.field.value);

      const nextPositionSize = $decimalValue(
        DecimalCalculator.value(sizeDv)
          .multiplyBy(quoteAssetPriceDv)
          .multiplyBy(leverageDv)
          .calculate()
      ).toDecimalString();

      updatePositionSize(nextPositionSize);
    }
    if (focusedField === 'positionSize') {
      const sizeDv = DecimalValue.fromDecimalString(positionSize.field.value);

      const nextCollateralSize = $decimalValue(
        DecimalCalculator.inNumerator((calc) => calc.value(sizeDv))
          .inDenominator((calc) => calc.value(quoteAssetPriceDv).multiplyBy(leverageDv))
          .calculate(DecimalValue)
      ).toDecimalString();
      updateCollateralSize(nextCollateralSize);
    }
  }, [
    collateralSize.field.value,
    currentQuoteAssetPrice.value,
    focusedField,
    leverage,
    positionSize.field.value,
    updateCollateralSize,
    updatePositionSize,
  ]);

  return (
    <>
      <AssetSizeInput
        assetName="USDC"
        label="Pay"
        onFocus={() => setFocusedField('collateralSize')}
        onSizeChange={updateCollateralSize}
        size={collateralSize.field.value}
        usdPrice={baseAssetUsdValue}
        error={collateralSize.fieldState.error?.message}
      />
      <AssetSizeInput
        assetName={quoteAssetName}
        label={orderSide}
        onFocus={() => setFocusedField('positionSize')}
        onSizeChange={updatePositionSize}
        size={positionSize.field.value}
        usdPrice={quoteAssetUsdValue}
        leverage={leverage}
        error={positionSize.fieldState.error?.message}
      />
    </>
  );
};
