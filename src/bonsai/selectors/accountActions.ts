import { createAppSelector } from '@/state/appTypes';

import {
  applyOperationsToSubaccount,
  createBatchedOperations,
} from '../calculators/accountActions';
import { calculateParentSubaccountSummary } from '../calculators/subaccount';
import { DepositUsdcProps, SubaccountOperations, WithdrawUsdcProps } from '../types/operationTypes';
import { selectRelevantMarketsData } from './account';
import { selectRawParentSubaccountData, selectRawSelectedMarketLeveragesData } from './base';

export const selectParentSubaccountSummaryDeposit = createAppSelector(
  [
    selectRawParentSubaccountData,
    selectRelevantMarketsData,
    selectRawSelectedMarketLeveragesData,
    (_s, input: DepositUsdcProps) => input,
  ],
  (parentSubaccount, markets, selectedMarketLeverages, depositInputs) => {
    if (parentSubaccount == null || markets == null || selectedMarketLeverages == null) {
      return undefined;
    }

    const operations = createBatchedOperations(SubaccountOperations.DepositUsdc(depositInputs));
    const modifiedParentSubaccount = applyOperationsToSubaccount(parentSubaccount, operations);
    const result = calculateParentSubaccountSummary(
      modifiedParentSubaccount,
      markets,
      selectedMarketLeverages
    );
    return result;
  }
);

export const selectParentSubaccountSummaryWithdrawal = createAppSelector(
  [
    selectRawParentSubaccountData,
    selectRelevantMarketsData,
    selectRawSelectedMarketLeveragesData,
    (_s, input: WithdrawUsdcProps) => input,
  ],
  (parentSubaccount, markets, selectedMarketLeverages, withdrawalInputs) => {
    if (parentSubaccount == null || markets == null || selectedMarketLeverages == null) {
      return undefined;
    }

    const operations = createBatchedOperations(SubaccountOperations.WithdrawUsdc(withdrawalInputs));
    const modifiedParentSubaccount = applyOperationsToSubaccount(parentSubaccount, operations);
    const result = calculateParentSubaccountSummary(
      modifiedParentSubaccount,
      markets,
      selectedMarketLeverages
    );
    return result;
  }
);
