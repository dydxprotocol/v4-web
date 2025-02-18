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

interface AdjustIsolatedMarginFormInputData {
  rawParentSubaccountData: ParentSubaccountDataBase | undefined;
  rawRelevantMarkets: MarketsData | undefined;
}

interface BeforeSummary {
  crossFreeCollateral?: number;
  crossMarginUsage?: number;
  positionMargin?: number;
  liquidationPrice?: number;
  positionLeverage?: number;
}

interface AfterSummary {
  crossFreeCollateral?: number;
  crossMarginUsage?: number;
  positionMargin?: number;
  positionLeverage?: number;
  liquidationPrice?: number;
}

interface InputSummary {
  percent: string;
  amount: string;
}

function calculateAdjustIsolatedMarginSummary(
  state: AdjustIsolatedMarginFormData,
  accountData: AdjustIsolatedMarginFormInputData
): AdjustIsolatedMarginFormSummaryData {}
