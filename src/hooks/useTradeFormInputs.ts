import { getTradeFormInputs } from '@/state/inputsSelectors';
import { useEffect } from 'react';
import { shallowEqual, useSelector } from 'react-redux';

import { TradeInputField } from '@/constants/abacus';

import abacusStateManager from '@/lib/abacus';

export const useTradeFormInputs = () => {
  const tradeFormInputValues = useSelector(getTradeFormInputs, shallowEqual);
  const { limitPriceInput, triggerPriceInput, trailingPercentInput } = tradeFormInputValues;

  useEffect(() => {
    const floatValue = parseFloat(triggerPriceInput);
    abacusStateManager.setTradeValue({
      value: floatValue,
      field: TradeInputField.triggerPrice,
    });
  }, [triggerPriceInput]);

  useEffect(() => {
    const floatValue = parseFloat(limitPriceInput);
    abacusStateManager.setTradeValue({ value: floatValue, field: TradeInputField.limitPrice });
  }, [limitPriceInput]);

  useEffect(() => {
    const floatValue = parseFloat(trailingPercentInput);
    abacusStateManager.setTradeValue({
      value: floatValue,
      field: TradeInputField.trailingPercent,
    });
  }, [trailingPercentInput]);
};
