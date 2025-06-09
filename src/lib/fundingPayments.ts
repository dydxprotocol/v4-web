import { OrderSide } from '@/bonsai/forms/trade/types';
import { FundingPayment } from '@/bonsai/rest/fundingPayments';
import { PerpetualMarketSummaries } from '@/bonsai/types/summaryTypes';

import { TOKEN_DECIMALS, USD_DECIMALS } from '@/constants/numbers';

export const getHydratedFundingPayment = ({
  id,
  data,
  marketSummaries,
}: {
  id: string;
  data: FundingPayment;
  marketSummaries: PerpetualMarketSummaries;
}) => {
  return {
    id,
    ...data,
    side: data.side === 'LONG' ? OrderSide.BUY : OrderSide.SELL,
    marketSummary: marketSummaries[data.ticker ?? ''],
    stepSizeDecimals: marketSummaries[data.ticker ?? '']?.stepSizeDecimals ?? TOKEN_DECIMALS,
    tickSizeDecimals: marketSummaries[data.ticker ?? '']?.tickSizeDecimals ?? USD_DECIMALS,
  };
};
