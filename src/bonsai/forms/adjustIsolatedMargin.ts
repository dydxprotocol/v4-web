import { mapIfPresent } from '@/lib/do';

import {
  calculateParentSubaccountPositions,
  calculateParentSubaccountSummary,
} from '../calculators/subaccount';
import { createVanillaReducer } from '../lib/forms';
import { MarketsData, ParentSubaccountDataBase } from '../types/rawTypes';

export interface AdjustIsolatedMarginFormData {
  type: AdjustIsolatedMarginType;
  amountInput:
    | { type: AdjustIsolatedMarginInputType.AMOUNT; amount: string }
    | { type: AdjustIsolatedMarginInputType.PERCENT; percent: string };
  childSubaccountNumber?: number;
}

export enum AdjustIsolatedMarginType {
  ADD = 'ADD',
  REMOVE = 'REMOVE',
}

export enum AdjustIsolatedMarginInputType {
  PERCENT = 'PERCENT',
  AMOUNT = 'AMOUNT',
}

const initialState: AdjustIsolatedMarginFormData = {
  type: AdjustIsolatedMarginType.ADD,
  amountInput: {
    type: AdjustIsolatedMarginInputType.AMOUNT,
    amount: '',
  },
  childSubaccountNumber: undefined,
};

const reducer = createVanillaReducer({
  initialState,
  actions: {
    setType: (state, type: AdjustIsolatedMarginType) => ({
      ...state,
      type,
    }),
    setAmount: (state, amount: string) => ({
      ...state,
      amountInput: {
        type: AdjustIsolatedMarginInputType.AMOUNT,
        amount,
      },
    }),
    setPercent: (state, percent: string) => ({
      ...state,
      amountInput: {
        type: AdjustIsolatedMarginInputType.PERCENT,
        percent,
      },
    }),
    initializeForm: (_state, childSubaccountNumber: number | undefined) => ({
      ...initialState,
      childSubaccountNumber,
    }),
    resetAmount: (state) => ({ ...state, amountInput: initialState.amountInput }),
    reset: () => initialState,
  },
});

interface InputData {
  rawParentSubaccountData: ParentSubaccountDataBase | undefined;
  rawRelevantMarkets: MarketsData | undefined;
}

interface AccountDetails {
  crossFreeCollateral?: number;
  crossMarginUsage?: number;

  positionMargin?: number;
  liquidationPrice?: number;
  positionLeverage?: number;
}

interface InputSummary {
  percent: string;
  amount: string;
}

interface SummaryData {
  accountBefore: AccountDetails;
  accountAfter: AccountDetails;
  inputs: InputSummary;
}

function calculateAdjustIsolatedMarginSummary(
  state: AdjustIsolatedMarginFormData,
  accountData: InputData
): SummaryData {
  const accountBefore = mapIfPresent(
    accountData.rawParentSubaccountData,
    accountData.rawRelevantMarkets,
    state.childSubaccountNumber,
    (rawParentSubaccountData, rawRelevantMarkets, childSubaccountNumber) =>
      getRelevantAccountDetails(rawParentSubaccountData, rawRelevantMarkets, childSubaccountNumber)
  );
}

function getRelevantAccountDetails(
  rawParentSubaccountData: ParentSubaccountDataBase,
  rawRelevantMarkets: MarketsData,
  childSubaccountNumber: number
): AccountDetails {
  const calculatedAccount = calculateParentSubaccountSummary(
    rawParentSubaccountData,
    rawRelevantMarkets
  );
  const calculatedPositions = calculateParentSubaccountPositions(
    rawParentSubaccountData,
    rawRelevantMarkets
  );
  const relevantPositions = calculatedPositions.filter(
    (p) => p.subaccountNumber === childSubaccountNumber
  );
  if (relevantPositions.length !== 1) {
    // eslint-disable-next-line no-console
    console.error(
      'calculateAdjustIsolatedMarginSummary: Expected exactly one isolated margin position for subaccount',
      childSubaccountNumber
    );
    return {};
  }
  const relevantPosition = relevantPositions.at(0);
  return {
    crossFreeCollateral: calculatedAccount.freeCollateral.toNumber(),
    crossMarginUsage: calculatedAccount.marginUsage?.toNumber(),
    positionMargin: relevantPosition?.marginValueMaintenance.toNumber(),
    liquidationPrice: relevantPosition?.liquidationPrice?.toNumber(),
    positionLeverage: relevantPosition?.leverage?.toNumber(),
  };
}
