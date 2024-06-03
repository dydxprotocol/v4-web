import { useEffect } from 'react';

import { shallowEqual } from 'react-redux';

import { TradeInputField } from '@/constants/abacus';

import { useAppSelector } from '@/state/appTypes';
import { getTradeFormInputs } from '@/state/inputsSelectors';

import abacusStateManager from '@/lib/abacus';

export const useTradeFormInputs = () => {
  const tradeFormInputValues = useAppSelector(getTradeFormInputs, shallowEqual);
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
