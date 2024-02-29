import { useEffect } from 'react';

import { shallowEqual, useSelector } from 'react-redux';

import { TradeInputField } from '@/constants/abacus';

import { getTradeFormInputs } from '@/state/inputsSelectors';

import abacusStateManager from '@/lib/abacus';

export const useTradeFormInputs = () => {
  const tradeFormInputValues = useSelector(getTradeFormInputs, shallowEqual);
  const { limitPriceInput, triggerPriceInput, trailingPercentInput } = tradeFormInputValues;

  useEffect(() => {
    abacusStateManager.setTradeValue({
      value: triggerPriceInput,
      field: TradeInputField.triggerPrice,
    });
  }, [triggerPriceInput]);

  useEffect(() => {
    abacusStateManager.setTradeValue({ value: limitPriceInput, field: TradeInputField.limitPrice });
  }, [limitPriceInput]);

  useEffect(() => {
    abacusStateManager.setTradeValue({
      value: trailingPercentInput,
      field: TradeInputField.trailingPercent,
    });
  }, [trailingPercentInput]);
};
