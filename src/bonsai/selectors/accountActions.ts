import { createAppSelector } from '@/state/appTypes';

import {
  applyOperationsToSubaccount,
  createUsdcDepositOperations,
  createUsdcWithdrawalOperations,
  UsdcDepositArgs,
  UsdcWithdrawArgs,
} from '../calculators/accountActions';
import { calculateParentSubaccountSummary } from '../calculators/subaccount';
import { selectRelevantMarketsData } from './account';
import { selectRawParentSubaccountData } from './base';

export const createSelectParentSubaccountSummaryDeposit = () =>
  createAppSelector(
    [
      selectRawParentSubaccountData,
      selectRelevantMarketsData,
      (_s, input: UsdcDepositArgs) => input,
    ],
    (parentSubaccount, markets, depositInputs) => {
      if (parentSubaccount == null || markets == null) {
        return undefined;
      }

      const operations = createUsdcDepositOperations(parentSubaccount, depositInputs);
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
      (_s, input: UsdcWithdrawArgs) => input,
    ],
    (parentSubaccount, markets, withdrawalInputs) => {
      if (parentSubaccount == null || markets == null) {
        return undefined;
      }

      const operations = createUsdcWithdrawalOperations(parentSubaccount, withdrawalInputs);
      const modifiedParentSubaccount = applyOperationsToSubaccount(parentSubaccount, operations);
      const result = calculateParentSubaccountSummary(modifiedParentSubaccount, markets);
      return result;
    }
  );
