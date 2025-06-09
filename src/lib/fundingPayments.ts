import { OrderSide } from '@/bonsai/forms/trade/types';
import { PerpetualMarketSummaries } from '@/bonsai/types/summaryTypes';

import { TOKEN_DECIMALS, USD_DECIMALS } from '@/constants/numbers';
import {
  IndexerFundingPaymentResponseObject,
  IndexerPositionSide,
} from '@/types/indexer/indexerApiGen';

export const getHydratedFundingPayment = ({
  id,
  data,
  marketSummaries,
}: {
  id: string;
  data: IndexerFundingPaymentResponseObject;
  marketSummaries: PerpetualMarketSummaries;
}) => {
  return {
    id,
    ...data,
    side: data.side === IndexerPositionSide.LONG ? OrderSide.BUY : OrderSide.SELL,
    marketSummary: marketSummaries[data.ticker],
    stepSizeDecimals: marketSummaries[data.ticker]?.stepSizeDecimals ?? TOKEN_DECIMALS,
    tickSizeDecimals: marketSummaries[data.ticker]?.tickSizeDecimals ?? USD_DECIMALS,
  };
};
