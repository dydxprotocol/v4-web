import { useCallback } from 'react';

import { OrderSizeInputs } from '@/bonsai/forms/trade/types';
import { BonsaiHelpers } from '@/bonsai/ontology';
import { NumberFormatValues } from 'react-number-format';
import { useDispatch } from 'react-redux';

import { TOKEN_DECIMALS, USD_DECIMALS } from '@/constants/numbers';

import { useAppSelector } from '@/state/appTypes';
import { closePositionFormActions } from '@/state/closePositionForm';
import {
  getClosePositionFormSummary,
  getClosePositionFormValues,
} from '@/state/tradeFormSelectors';

import { calc, mapIfPresent } from '@/lib/do';
import { MustBigNumber } from '@/lib/numbers';
import { orEmptyObj } from '@/lib/typeUtils';

export const useClosePositionFormInputs = () => {
  const dispatch = useDispatch();

  const { size, limitPrice } = useAppSelector(getClosePositionFormValues);
  const { summary } = useAppSelector(getClosePositionFormSummary);

  const { tickSizeDecimals, stepSizeDecimals } = orEmptyObj(
    useAppSelector(BonsaiHelpers.currentMarket.stableMarketInfo)
  );

  const midMarketPrice = useAppSelector(BonsaiHelpers.currentMarket.midPrice.data)?.toNumber();

  const onAmountInput = useCallback(
    ({ formattedValue }: { floatValue?: number; formattedValue: string }) => {
      dispatch(closePositionFormActions.setSizeToken(formattedValue));
    },
    [dispatch]
  );

  const setLimitPrice = useCallback(
    (value: string) => {
      dispatch(closePositionFormActions.setLimitPrice(value));
    },
    [dispatch]
  );

  const onLimitPriceInput = useCallback(
    ({ value }: NumberFormatValues) => {
      setLimitPrice(value);
    },
    [setLimitPrice]
  );

  const setLimitPriceToMidPrice = useCallback(() => {
    if (!midMarketPrice) return;
    const midMarketPriceValue = MustBigNumber(midMarketPrice).toFixed(
      tickSizeDecimals ?? USD_DECIMALS
    );
    setLimitPrice(midMarketPriceValue);
  }, [midMarketPrice, setLimitPrice, tickSizeDecimals]);

  const amountInput = calc(() => {
    const calculated = mapIfPresent(summary.tradeInfo.inputSummary.size?.size, (effectiveSize) =>
      MustBigNumber(effectiveSize).toFixed(stepSizeDecimals ?? TOKEN_DECIMALS)
    );
    const input = size != null && OrderSizeInputs.is.SIZE(size) ? size.value.value : undefined;
    return input ?? calculated ?? '';
  });

  return {
    amountInput,
    limitPriceInput: limitPrice,
    onAmountInput,
    onLimitPriceInput,
    setLimitPriceToMidPrice: midMarketPrice ? setLimitPriceToMidPrice : undefined,
  };
};
