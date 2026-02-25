import { useEffect } from 'react';

import { BonsaiHelpers } from '@/bonsai/ontology';

import { AppRoute } from '@/constants/routes';

import { useCurrentMarketId } from '@/hooks/useCurrentMarketId';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { tradeFormActions } from '@/state/tradeForm';
import { getTradeFormValues } from '@/state/tradeFormSelectors';

import { orEmptyObj } from '@/lib/typeUtils';

import CloseTradeForm from './CloseTradeForm';
import RegularTradeForm from './RegularTradeForm';

const TradeForm = () => {
  const dispatch = useAppDispatch();
  const { marketId } = useCurrentMarketId(AppRoute.TradeForm);

  const tradeValues = useAppSelector(getTradeFormValues);
  const { ticker } = orEmptyObj(useAppSelector(BonsaiHelpers.currentMarket.stableMarketInfo));

  useEffect(() => {
    if (marketId !== tradeValues.marketId) {
      dispatch(tradeFormActions.setMarketId(ticker));
    }
  }, [ticker, dispatch]);

  const isClosingPosition = tradeValues.isClosingPosition;

  if (isClosingPosition) {
    return <CloseTradeForm market={marketId} />;
  }

  return <RegularTradeForm />;
};

export default TradeForm;
