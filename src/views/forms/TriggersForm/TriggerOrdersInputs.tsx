import { shallowEqual } from 'react-redux';

import { TriggerOrdersInputField } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';

import { useAppSelector } from '@/state/appTypes';
import { getTriggerOrdersInputs } from '@/state/inputsSelectors';

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
  const { stopLossOrder, takeProfitOrder } =
    useAppSelector(getTriggerOrdersInputs, shallowEqual) ?? {};

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
        inputOrderFields={{
          triggerPriceField: TriggerOrdersInputField.takeProfitPrice,
          percentDiffField: TriggerOrdersInputField.takeProfitPercentDiff,
          usdcDiffField: TriggerOrdersInputField.takeProfitUsdcDiff,
        }}
        isMultiple={multipleTakeProfitOrders}
        isNegativeDiff={false}
        price={takeProfitOrder?.price}
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
        inputOrderFields={{
          triggerPriceField: TriggerOrdersInputField.stopLossPrice,
          percentDiffField: TriggerOrdersInputField.stopLossPercentDiff,
          usdcDiffField: TriggerOrdersInputField.stopLossUsdcDiff,
        }}
        isMultiple={multipleStopLossOrders}
        isNegativeDiff
        price={stopLossOrder?.price}
        tickSizeDecimals={tickSizeDecimals}
        onViewOrdersClick={onViewOrdersClick}
      />
    </>
  );
};
