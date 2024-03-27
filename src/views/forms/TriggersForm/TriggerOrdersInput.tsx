import { shallowEqual, useSelector } from 'react-redux';

import { TriggerOrdersInputField } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';

import { getTriggerOrdersInputs } from '@/state/inputsSelectors';

import abacusStateManager from '@/lib/abacus';

import { TriggerOrderInputs } from './TriggerOrderInputs';

type ElementProps = {
  symbol: string;
  multipleTakeProfitOrders: boolean;
  multipleStopLossOrders: boolean;
  tickSizeDecimals?: number;
  onViewOrdersClick: () => void;
};

export const TriggerOrdersInput = ({
  symbol,
  multipleTakeProfitOrders,
  multipleStopLossOrders,
  tickSizeDecimals,
  onViewOrdersClick,
}: ElementProps) => {
  const { stopLossOrder, takeProfitOrder } =
    useSelector(getTriggerOrdersInputs, shallowEqual) || {};

  const onStopLossTriggerPriceChange = (value: string | null) => {
    abacusStateManager.setTriggerOrdersValue({
      value,
      field: TriggerOrdersInputField.stopLossPrice,
    });
  };

  const onTakeProfitTriggerPriceChange = (value: string | null) => {
    abacusStateManager.setTriggerOrdersValue({
      value,
      field: TriggerOrdersInputField.takeProfitPrice,
    });
  };

  const onStopLossTriggerPercentChange = (value: string | null) => {
    abacusStateManager.setTriggerOrdersValue({
      value,
      field: TriggerOrdersInputField.stopLossPercentDiff,
    });
  };

  const onTakeProfitTriggerPercentChange = (value: string | null) => {
    abacusStateManager.setTriggerOrdersValue({
      value,
      field: TriggerOrdersInputField.takeProfitPercentDiff,
    });
  };

  const onStopLossTriggerUsdcChange = (value: string | null) => {
    abacusStateManager.setTriggerOrdersValue({
      value,
      field: TriggerOrdersInputField.stopLossUsdcDiff,
    });
  };

  const onTakeProfitTriggerUsdcChange = (value: string | null) => {
    abacusStateManager.setTriggerOrdersValue({
      value,
      field: TriggerOrdersInputField.takeProfitUsdcDiff,
    });
  };

  return (
    <>
      <TriggerOrderInputs
        symbol={symbol}
        tooltipId="take-profit"
        stringKeys={{
          header: STRING_KEYS.TAKE_PROFIT,
          price: STRING_KEYS.TP_PRICE,
          output: STRING_KEYS.GAIN,
        }}
        tickSizeDecimals={tickSizeDecimals}
        onViewOrdersClick={onViewOrdersClick}
        onTriggerPriceChange={onTakeProfitTriggerPriceChange}
        onPercentDiffChange={onTakeProfitTriggerPercentChange}
        onUsdcDiffChange={onTakeProfitTriggerUsdcChange}
        isMultiple={multipleTakeProfitOrders}
        price={takeProfitOrder?.price}
      />
      <TriggerOrderInputs
        symbol={symbol}
        tooltipId="stop-loss"
        stringKeys={{
          header: STRING_KEYS.STOP_LOSS,
          price: STRING_KEYS.SL_PRICE,
          output: STRING_KEYS.LOSS,
        }}
        tickSizeDecimals={tickSizeDecimals}
        onViewOrdersClick={onViewOrdersClick}
        onTriggerPriceChange={onStopLossTriggerPriceChange}
        onPercentDiffChange={onStopLossTriggerPercentChange}
        onUsdcDiffChange={onStopLossTriggerUsdcChange}
        isMultiple={multipleStopLossOrders}
        price={stopLossOrder?.price}
      />
    </>
  );
};
