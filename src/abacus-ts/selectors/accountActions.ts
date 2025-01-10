import { shallowEqual } from 'react-redux';

import { createAppSelector } from '@/state/appTypes';

import {
  applyOperationsToSubaccount,
  calculateParentSubaccountPositions,
  calculateParentSubaccountSummary,
  createUsdcDepositOperations,
  createUsdcWithdrawalOperations,
} from '../calculators/subaccount';
import { selectRelevantMarketsData } from './account';
import { selectRawParentSubaccountData } from './base';

export const createSelectParentSubaccountSummaryDeposit = () =>
  createAppSelector(
    [
      selectRawParentSubaccountData,
      selectRelevantMarketsData,
      (
        _s,
        input: {
          subaccountNumber: number;
          depositAmount: string;
        }
      ) => input,
    ],
    (parentSubaccount, markets, depositInputs) => {
      if (parentSubaccount == null || markets == null) {
        return undefined;
      }

      const operations = createUsdcDepositOperations(depositInputs);
      const modifiedParentSubaccount = applyOperationsToSubaccount(parentSubaccount, operations);
      const result = calculateParentSubaccountSummary(modifiedParentSubaccount, markets);
      return result;
    },
    {
      // use shallow equal for result so that we only update when these specific keys differ
      memoizeOptions: { resultEqualityCheck: shallowEqual },
    }
  );

export const createSelectParentSubaccountPositionsDeposit = () =>
  createAppSelector(
    [
      selectRawParentSubaccountData,
      selectRelevantMarketsData,
      (
        _s,
        input: {
          subaccountNumber: number;
          depositAmount: string;
        }
      ) => input,
    ],
    (parentSubaccount, markets, depositInputs) => {
      if (parentSubaccount == null || markets == null) {
        return undefined;
      }

      const operations = createUsdcDepositOperations(depositInputs);
      const modifiedParentSubaccount = applyOperationsToSubaccount(parentSubaccount, operations);
      const result = calculateParentSubaccountPositions(modifiedParentSubaccount, markets);
      return result;
    },
    {
      // use shallow equal for result so that we only update when these specific keys differ
      memoizeOptions: { resultEqualityCheck: shallowEqual },
    }
  );

export const createSelectParentSubaccountSummaryWithdrawal = () =>
  createAppSelector(
    [
      selectRawParentSubaccountData,
      selectRelevantMarketsData,
      (
        _s,
        input: {
          subaccountNumber: number;
          withdrawAmount: string;
        }
      ) => input,
    ],
    (parentSubaccount, markets, withdrawalInputs) => {
      if (parentSubaccount == null || markets == null) {
        return undefined;
      }

      const operations = createUsdcWithdrawalOperations(withdrawalInputs);
      const modifiedParentSubaccount = applyOperationsToSubaccount(parentSubaccount, operations);
      const result = calculateParentSubaccountSummary(modifiedParentSubaccount, markets);
      return result;
    },
    {
      // use shallow equal for result so that we only update when these specific keys differ
      memoizeOptions: { resultEqualityCheck: shallowEqual },
    }
  );

export const createSelectParentSubaccountPositionsWithdrawal = () =>
  createAppSelector(
    [
      selectRawParentSubaccountData,
      selectRelevantMarketsData,
      (
        _s,
        input: {
          subaccountNumber: number;
          withdrawAmount: string;
        }
      ) => input,
    ],
    (parentSubaccount, markets, withdrawalInputs) => {
      if (parentSubaccount == null || markets == null) {
        return undefined;
      }

      const operations = createUsdcWithdrawalOperations(withdrawalInputs);
      const modifiedParentSubaccount = applyOperationsToSubaccount(parentSubaccount, operations);
      const result = calculateParentSubaccountPositions(modifiedParentSubaccount, markets);
      return result;
    },
    {
      // use shallow equal for result so that we only update when these specific keys differ
      memoizeOptions: { resultEqualityCheck: shallowEqual },
    }
  );
