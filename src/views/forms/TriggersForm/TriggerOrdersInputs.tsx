import { shallowEqual } from 'react-redux';

import { STRING_KEYS } from '@/constants/localization';

import { useAppSelector } from '@/state/appTypes';
import { getTriggersFormState, getTriggersFormSummary } from '@/state/inputsSelectors';

import { TriggerOrderInputs } from './TriggerOrderInputs';

type ElementProps = {
  symbol: string;
  multipleTakeProfitOrders: boolean;
  multipleStopLossOrders: boolean;
  tickSizeDecimals?: number;
  onViewOrdersClick: () => void;
};

export const TriggerOrdersInputs = ({
  symbol,
  multipleTakeProfitOrders,
  multipleStopLossOrders,
  tickSizeDecimals,
  onViewOrdersClick,
}: ElementProps) => {
  const triggerFormInputValues = useAppSelector(getTriggersFormState);
  const triggerFormSummary = useAppSelector(getTriggersFormSummary, shallowEqual);

  return (
    <>
      <TriggerOrderInputs
        symbol={symbol}
        tooltipId="take-profit"
        stringKeys={{
          header: STRING_KEYS.TAKE_PROFIT,
          headerDiff: STRING_KEYS.PROFIT_COLON,
          price: STRING_KEYS.TP_PRICE,
          output: STRING_KEYS.GAIN,
        }}
        isMultiple={multipleTakeProfitOrders}
        isNegativeDiff={false}
        inputState={triggerFormInputValues.takeProfitOrder}
        summaryState={triggerFormSummary.summary.takeProfitOrder}
        isStopLoss={false}
        tickSizeDecimals={tickSizeDecimals}
        onViewOrdersClick={onViewOrdersClick}
      />
      <TriggerOrderInputs
        symbol={symbol}
        tooltipId="stop-loss"
        stringKeys={{
          header: STRING_KEYS.STOP_LOSS,
          headerDiff: STRING_KEYS.LOSS_COLON,
          price: STRING_KEYS.SL_PRICE,
          output: STRING_KEYS.LOSS,
        }}
        isMultiple={multipleStopLossOrders}
        isNegativeDiff
        inputState={triggerFormInputValues.stopLossOrder}
        summaryState={triggerFormSummary.summary.stopLossOrder}
        isStopLoss
        tickSizeDecimals={tickSizeDecimals}
        onViewOrdersClick={onViewOrdersClick}
      />
    </>
  );
};
