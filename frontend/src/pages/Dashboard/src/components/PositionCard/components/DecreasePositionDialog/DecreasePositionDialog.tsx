import { memo, useCallback, useState } from 'react';
import { Dialog } from '@radix-ui/themes';
import { type PositionStableId } from 'fuel-ts-sdk';
import { PositionSize } from 'fuel-ts-sdk/trading';
import { toast } from 'react-toastify';
import { useTradingSdk } from '@/lib/fuel-ts-sdk';
import * as styles from './DecreasePositionDialog.css';
import {
  calculateSizeFromPercentage,
  calculateSliderPercentage,
  getPositionAction,
  isValidDecreaseAmount,
} from './DecreasePositionDialog.utils';
import { Actions } from './components/Actions';
import { CurrentPositionInfo } from './components/CurrentPositionInfo';
import { SizeInput } from './components/SizeInput';
import { SizeSlider } from './components/SizeSlider';
import { Summary } from './components/Summary';

type DecreasePositionDialogProps = {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  positionId: PositionStableId;
};

export const DecreasePositionDialog = memo(
  ({ open, onOpenChange, positionId }: DecreasePositionDialogProps) => {
    const tradingSdk = useTradingSdk();
    const [sizeToDecrease, setSizeToDecrease] = useState('');

    const assetSymbol = tradingSdk.getWatchedAsset()?.name ?? '...';

    const position = tradingSdk.getPositionById(positionId);
    if (!position) {
      throw new Error('Position not found');
    }

    const totalPositionSize = tradingSdk.getPositionSizeInQuoteAsset(position.stableId);

    const sliderPercentage = calculateSliderPercentage(sizeToDecrease, totalPositionSize);

    const handlePercentageChange = (valueInPercents: string) => {
      const newSize = calculateSizeFromPercentage(valueInPercents, totalPositionSize);
      setSizeToDecrease(newSize);
    };

    const updateSize = (nextValue: number | string) => {
      if (String(nextValue) === '0') {
        setSizeToDecrease('');
        return;
      }

      setSizeToDecrease(String(nextValue));
    };

    const submitPositionChange = useCallback(async () => {
      const sizeUsdc = position.size;
      const sizeDeltaUsdc = PositionSize.fromDecimalString(
        calculateSizeFromPercentage(sliderPercentage, sizeUsdc)
      );

      const action = getPositionAction(sliderPercentage);
      const actionPastTense = action === 'close' ? 'closed' : 'decreased';

      try {
        await tradingSdk.decreasePosition({
          positionId,
          sizeDelta: sizeDeltaUsdc,
        });
        toast.success(`Position ${actionPastTense} successfully`);
        onOpenChange?.(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        toast.error(`Failed to ${action} position: ${message}`);
      }
    }, [position.size, sliderPercentage, tradingSdk, positionId, onOpenChange]);

    const isValidDecrease = isValidDecreaseAmount(sizeToDecrease, totalPositionSize);

    return (
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Content className={styles.dialogContent}>
          <Dialog.Title className={styles.dialogTitle}>Decrease Position</Dialog.Title>

          <CurrentPositionInfo assetSymbol={assetSymbol} currentSize={totalPositionSize} />

          <div className={styles.inputSection}>
            <SizeInput
              assetSymbol={assetSymbol}
              amountToDecrease={sizeToDecrease}
              onChange={updateSize}
            />
          </div>

          <div className={styles.sliderSection}>
            <SizeSlider valueInPercents={sliderPercentage} onValueChange={handlePercentageChange} />
          </div>

          <div css={styles.summarySection}>
            <Summary
              assetSymbol={assetSymbol}
              decreaseAmount={sizeToDecrease}
              totalPositionSize={totalPositionSize}
            />
          </div>

          <Actions
            onSubmit={submitPositionChange}
            submitTitle={`${sliderPercentage === '100' ? 'Close' : 'Decrease'} Position`}
            submittable={isValidDecrease}
          />
        </Dialog.Content>
      </Dialog.Root>
    );
  }
);

DecreasePositionDialog.displayName = 'DecreasePositionDialog';
