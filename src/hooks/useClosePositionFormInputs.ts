import { useCallback, useEffect } from 'react';

import { NumberFormatValues } from 'react-number-format';
import { shallowEqual, useDispatch } from 'react-redux';

import { AbacusOrderType, ClosePositionInputField } from '@/constants/abacus';
import { TOKEN_DECIMALS, USD_DECIMALS } from '@/constants/numbers';

import { useAppSelector } from '@/state/appTypes';
import { setClosePositionFormInputs } from '@/state/inputs';
import { getClosePositionFormInputs, getInputClosePositionData } from '@/state/inputsSelectors';
import {
  getCurrentMarketConfig,
  getCurrentMarketMidMarketPrice,
} from '@/state/perpetualsSelectors';

import abacusStateManager from '@/lib/abacus';
import { MustBigNumber } from '@/lib/numbers';

export const useClosePositionFormInputs = () => {
  const closePositionFormInputValues = useAppSelector(getClosePositionFormInputs, shallowEqual);
  const { limitPriceInput } = closePositionFormInputValues;
  const dispatch = useDispatch();

  const {
    size: sizeData,
    price,
    type,
  } = useAppSelector(getInputClosePositionData, shallowEqual) ?? {};
  const useLimit = type === AbacusOrderType.Limit;
  const { size } = sizeData ?? {};
  const { limitPrice } = price ?? {};

  const { stepSizeDecimals, tickSizeDecimals } =
    useAppSelector(getCurrentMarketConfig, shallowEqual) ?? {};

  const midMarketPrice = useAppSelector(getCurrentMarketMidMarketPrice, shallowEqual);

  // when useLimit is toggled true, reset limit price input to use the mid price set in abacus
  useEffect(() => {
    if (limitPrice)
      dispatch(setClosePositionFormInputs({ limitPriceInput: limitPrice.toString() }));
  }, [useLimit]);

  const onAmountInput = ({ floatValue }: { floatValue?: number }) => {
    const closeAmount = MustBigNumber(floatValue)
      .abs()
      .toFixed(stepSizeDecimals ?? TOKEN_DECIMALS);

    abacusStateManager.setClosePositionValue({
      value: floatValue ? closeAmount : null,
      field: ClosePositionInputField.size,
    });
  };

  const setLimitPrice = useCallback((value: string) => {
    dispatch(setClosePositionFormInputs({ limitPriceInput: value }));
    abacusStateManager.setClosePositionValue({
      value,
      field: ClosePositionInputField.limitPrice,
    });
  }, []);

  const onLimitPriceInput = ({ value }: NumberFormatValues) => {
    setLimitPrice(value);
  };

  const setLimitPriceToMidPrice = useCallback(() => {
    if (!midMarketPrice) return;
    const midMarketPriceValue = MustBigNumber(midMarketPrice).toFixed(
      tickSizeDecimals ?? USD_DECIMALS
    );
    setLimitPrice(midMarketPriceValue);
  }, [midMarketPrice, setLimitPrice, tickSizeDecimals]);

  return {
    amountInput: size,
    limitPriceInput,
    onAmountInput,
    onLimitPriceInput,
    setLimitPriceToMidPrice: midMarketPrice ? setLimitPriceToMidPrice : undefined,
  };
};
