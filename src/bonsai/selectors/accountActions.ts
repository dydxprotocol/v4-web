import { createAppSelector } from '@/state/appTypes';

import {
  applyOperationsToSubaccount,
  createBatchedOperations,
} from '../calculators/accountActions';
import { calculateParentSubaccountSummary } from '../calculators/subaccount';
import { DepositUsdcProps, SubaccountOperations, WithdrawUsdcProps } from '../types/operationTypes';
import { selectRelevantMarketsData } from './account';
import { selectRawParentSubaccountData } from './base';

export const createSelectParentSubaccountSummaryDeposit = () =>
  createAppSelector(
    [
      selectRawParentSubaccountData,
      selectRelevantMarketsData,
      (_s, input: DepositUsdcProps) => input,
    ],
    (parentSubaccount, markets, depositInputs) => {
      if (parentSubaccount == null || markets == null) {
        return undefined;
      }

      const operations = createBatchedOperations(SubaccountOperations.DepositUsdc(depositInputs));
      const modifiedParentSubaccount = applyOperationsToSubaccount(parentSubaccount, operations);
      const result = calculateParentSubaccountSummary(modifiedParentSubaccount, markets);
      return result;
    }
  );

export const createSelectParentSubaccountSummaryWithdrawal = () =>
  createAppSelector(
    [
      selectRawParentSubaccountData,
      selectRelevantMarketsData,
      (_s, input: WithdrawUsdcProps) => input,
    ],
    (parentSubaccount, markets, withdrawalInputs) => {
      if (parentSubaccount == null || markets == null) {
        return undefined;
      }

      const operations = createBatchedOperations(
        SubaccountOperations.WithdrawUsdc(withdrawalInputs)
      );
      const modifiedParentSubaccount = applyOperationsToSubaccount(parentSubaccount, operations);
      const result = calculateParentSubaccountSummary(modifiedParentSubaccount, markets);
      return result;
    }
  );
