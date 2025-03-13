import { GroupedSubaccountSummary, SubaccountPosition } from '@/bonsai/types/summaryTypes';

import { TradeFormFieldStates, TradeFormInputData, TradeSummary } from './types';

function calculateTradeInfo(
  fieldStates: TradeFormFieldStates,
  baseAccount: { account?: GroupedSubaccountSummary; position?: SubaccountPosition } | undefined,
  accountData: TradeFormInputData
): TradeSummary {}
