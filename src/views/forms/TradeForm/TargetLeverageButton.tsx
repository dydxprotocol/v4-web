import { useCallback } from 'react';

import { shallowEqual } from 'react-redux';

import { DialogTypes } from '@/constants/dialogs';
import { LEVERAGE_DECIMALS } from '@/constants/numbers';

import { Button } from '@/components/Button';
import { Output, OutputType } from '@/components/Output';
import { WithTooltip } from '@/components/WithTooltip';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';
import { getInputTradeData, useTradeFormData } from '@/state/inputsSelectors';

export const TargetLeverageButton = ({ className }: { className?: string }) => {
  const { needsTargetLeverage } = useTradeFormData();

  const currentTradeData = useAppSelector(getInputTradeData, shallowEqual);

  const { targetLeverage } = currentTradeData ?? {};

  const dispatch = useAppDispatch();
  const handleClick = useCallback(() => {
    dispatch(openDialog({ type: DialogTypes.AdjustTargetLeverage }));
  }, [dispatch]);

  return (
    needsTargetLeverage && (
      <WithTooltip
        className={className}
        tooltip="target-leverage"
        stringParams={{ TARGET_LEVERAGE: targetLeverage?.toFixed(LEVERAGE_DECIMALS) }}
      >
        <Button onClick={handleClick}>
          <Output type={OutputType.Multiple} value={targetLeverage} />
        </Button>
      </WithTooltip>
    )
  );
};
