import BigNumber from 'bignumber.js';

import { assertNever } from '@/lib/assertNever';
import { calc, mapIfPresent } from '@/lib/do';
import { MustBigNumber } from '@/lib/numbers';

import {
  applyOperationsToSubaccount,
  createBatchedOperations,
} from '../calculators/accountActions';
import {
  calculateParentSubaccountPositions,
  calculateParentSubaccountSummary,
} from '../calculators/subaccount';
import { createForm, createVanillaReducer, ValidationError } from '../lib/forms';
import { SubaccountOperations } from '../types/operationTypes';
import { MarketsData, ParentSubaccountDataBase } from '../types/rawTypes';

export interface AdjustIsolatedMarginFormState {
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

const initialState: AdjustIsolatedMarginFormState = {
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
  percent?: string;
  amount?: string;
}

interface SummaryData {
  accountBefore: AccountDetails;
  accountAfter: AccountDetails;
  inputs: InputSummary;
}

function calculateSummary(
  state: AdjustIsolatedMarginFormState,
  accountData: InputData
): SummaryData {
  const accountBefore = mapIfPresent(
    accountData.rawParentSubaccountData,
    accountData.rawRelevantMarkets,
    state.childSubaccountNumber,
    (rawParentSubaccountData, rawRelevantMarkets, childSubaccountNumber) =>
      getRelevantAccountDetails(rawParentSubaccountData, rawRelevantMarkets, childSubaccountNumber)
  );

  const inputs = calc((): Partial<InputSummary> | undefined => {
    if (state.type === AdjustIsolatedMarginType.ADD) {
      if (state.amountInput.type === AdjustIsolatedMarginInputType.AMOUNT) {
        const parsedAmount = stringToNumberStringOrUndefined(state.amountInput.amount);
        return {
          amount: parsedAmount,
          percent:
            accountBefore?.crossFreeCollateral != null && accountBefore.crossFreeCollateral !== 0
              ? MustBigNumber(parsedAmount).div(accountBefore.crossFreeCollateral).toString()
              : undefined,
        };
      }
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (state.amountInput.type === AdjustIsolatedMarginInputType.PERCENT) {
        const parsedPercent = stringToNumberStringOrUndefined(state.amountInput.percent);
        return {
          amount:
            accountBefore?.crossFreeCollateral != null
              ? MustBigNumber(parsedPercent).times(accountBefore.crossFreeCollateral).toString()
              : undefined,
          percent: parsedPercent,
        };
      }
      assertNever(state.amountInput);
      return undefined;
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (state.type === AdjustIsolatedMarginType.REMOVE) {
      if (state.amountInput.type === AdjustIsolatedMarginInputType.AMOUNT) {
        const parsedAmount = stringToNumberStringOrUndefined(state.amountInput.amount);
        return {
          amount: parsedAmount,
          percent:
            accountBefore?.positionMargin != null && accountBefore.positionMargin !== 0
              ? MustBigNumber(parsedAmount).div(accountBefore.positionMargin).toString()
              : undefined,
        };
      }
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (state.amountInput.type === AdjustIsolatedMarginInputType.PERCENT) {
        const parsedPercent = stringToNumberStringOrUndefined(state.amountInput.percent);
        return {
          amount:
            accountBefore?.positionMargin != null
              ? MustBigNumber(parsedPercent).times(accountBefore.positionMargin).toString()
              : undefined,
          percent: parsedPercent,
        };
      }
      assertNever(state.amountInput);
      return undefined;
    }
    assertNever(state.type);
    return undefined;
  });

  const accountAfter = calc(() => {
    const operationDetails = calc(() => {
      if (state.childSubaccountNumber == null) {
        return undefined;
      }
      if (state.type === AdjustIsolatedMarginType.ADD) {
        return { source: 0, target: state.childSubaccountNumber };
      }
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (state.type === AdjustIsolatedMarginType.REMOVE) {
        return { source: state.childSubaccountNumber, target: 0 };
      }
      assertNever(state.type);
      return undefined;
    });

    if (operationDetails == null) {
      return undefined;
    }
    if (inputs?.amount == null) {
      return undefined;
    }
    const operations = createBatchedOperations(
      SubaccountOperations.SubaccountTransfer({
        amount: inputs.amount,
        recipientSubaccountNumber: operationDetails.target,
        senderSubaccountNumber: operationDetails.source,
      })
    );
    return mapIfPresent(
      accountData.rawParentSubaccountData,
      accountData.rawRelevantMarkets,
      state.childSubaccountNumber,
      (rawParentSubaccountData, rawRelevantMarkets, childSubaccountNumber) =>
        getRelevantAccountDetails(
          applyOperationsToSubaccount(rawParentSubaccountData, operations),
          rawRelevantMarkets,
          childSubaccountNumber
        )
    );
  });

  return {
    accountAfter: accountAfter ?? {},
    accountBefore: accountBefore ?? {},
    inputs: inputs ?? {},
  };
}

function getErrors(state: AdjustIsolatedMarginFormState, summary: SummaryData): ValidationError[] {
  return [];
}

export const AdjustIsolatedMarginForm = createForm({
  reducer,
  calculateSummary,
  getErrors,
});

function stringToNumberStringOrUndefined(num: string): string | undefined {
  const bn = new BigNumber(num);
  if (!bn.isFinite()) {
    return undefined;
  }
  return bn.toString();
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
