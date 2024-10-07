import { useEffect } from 'react';

import { shallowEqual } from 'react-redux';

import { TradeInputField } from '@/constants/abacus';

import { getIsAccountConnected } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';
import {
  getInputTradeData,
  getInputTradeOptions,
  getTradeFormInputs,
} from '@/state/inputsSelectors';

import abacusStateManager from '@/lib/abacus';
import { orEmptyObj } from '@/lib/typeUtils';

export const useTradeFormInputs = () => {
  const tradeFormInputValues = useAppSelector(getTradeFormInputs, shallowEqual);
  const { limitPriceInput, triggerPriceInput, trailingPercentInput } = tradeFormInputValues;

  const isAccountConnected = useAppSelector(getIsAccountConnected);
  const { needsLimitPrice } = orEmptyObj(useAppSelector(getInputTradeOptions, shallowEqual));
  const abacusInput = useAppSelector(getInputTradeData, shallowEqual);

  const shouldResyncLimitPrice =
    isAccountConnected &&
    needsLimitPrice &&
    limitPriceInput !== '' &&
    !abacusInput?.price && // when abacus price has not been set
    abacusInput?.size; // but abacus size has been set

  useEffect(() => {
    // limit price should always be prefilled with mid price if available
    // resync when abacus size input has been updated (i.e. when user has changed size and abacus input is editable)
    if (shouldResyncLimitPrice)
      abacusStateManager.setTradeValue({
        value: limitPriceInput,
        field: TradeInputField.limitPrice,
      });
  }, [shouldResyncLimitPrice, limitPriceInput]);

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
