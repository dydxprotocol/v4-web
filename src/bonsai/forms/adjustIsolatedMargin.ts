import BigNumber from 'bignumber.js';

import { NUM_PARENT_SUBACCOUNTS } from '@/constants/account';
import { STRING_KEYS } from '@/constants/localization';

import { assertNever } from '@/lib/assertNever';
import { calc, mapIfPresent } from '@/lib/do';
import { MaybeBigNumber, MustBigNumber } from '@/lib/numbers';

import {
  applyOperationsToSubaccount,
  createBatchedOperations,
} from '../calculators/accountActions';
import {
  calculateParentSubaccountPositions,
  calculateParentSubaccountSummary,
} from '../calculators/subaccount';
import { createForm, createVanillaReducer, ErrorType, ValidationError } from '../lib/forms';
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
  canViewAccount?: boolean;
}

interface AccountDetails {
  crossFreeCollateral?: number;
  crossMarginUsage?: number;

  positionMargin?: number;
  positionMaintenanceRisk?: number;
  positionMaxMarketLeverage?: number;
  positionNotional?: number;
  liquidationPrice?: number;
  positionLeverage?: number;
}

interface InputSummary {
  percent?: string;
  amount?: string;
  maxAmount?: string;
}

interface SummaryData {
  accountBefore: AccountDetails;
  accountAfter: AccountDetails;
  inputs: InputSummary;
}

// leave this much free collateral so the transaction doesn't fail collaterliazation checks due to price movements
const COLLATERLIAZATION_ALLOWANCE = 0.01;
const MAX_LEVERAGE_BUFFER_PERCENT = 0.99;

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
      const maxTransfer = mapIfPresent(accountBefore?.crossFreeCollateral, (collat) =>
        clamp(Math.floor(collat - COLLATERLIAZATION_ALLOWANCE), 0, Number.MAX_SAFE_INTEGER)
      );
      if (state.amountInput.type === AdjustIsolatedMarginInputType.AMOUNT) {
        const parsedAmount = stringToNumberStringOrUndefined(state.amountInput.amount);
        return {
          amount: parsedAmount,
          percent:
            maxTransfer != null && maxTransfer !== 0 && parsedAmount != null
              ? MustBigNumber(parsedAmount).div(maxTransfer).toString()
              : undefined,
          maxAmount: MaybeBigNumber(maxTransfer)?.toString(),
        };
      }
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (state.amountInput.type === AdjustIsolatedMarginInputType.PERCENT) {
        const parsedPercent = stringToNumberStringOrUndefined(state.amountInput.percent);
        return {
          amount:
            maxTransfer != null && parsedPercent != null
              ? MustBigNumber(parsedPercent).times(maxTransfer).toString()
              : undefined,
          percent: parsedPercent,
          maxAmount: MaybeBigNumber(maxTransfer)?.toString(),
        };
      }
      assertNever(state.amountInput);
      return undefined;
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (state.type === AdjustIsolatedMarginType.REMOVE) {
      const maxTransfer = mapIfPresent(
        accountBefore?.positionMargin,
        accountBefore?.positionMaxMarketLeverage,
        accountBefore?.positionNotional,
        (margin, maxLeverage, notional) =>
          clamp(
            margin - notional / ((maxLeverage || 1) * MAX_LEVERAGE_BUFFER_PERCENT),
            0,
            Number.MAX_SAFE_INTEGER
          )
      );
      if (state.amountInput.type === AdjustIsolatedMarginInputType.AMOUNT) {
        const parsedAmount = stringToNumberStringOrUndefined(state.amountInput.amount);
        return {
          amount: parsedAmount,
          percent:
            maxTransfer != null && maxTransfer !== 0 && parsedAmount != null
              ? MustBigNumber(parsedAmount).div(maxTransfer).toString()
              : undefined,
          maxAmount: MaybeBigNumber(maxTransfer)?.toString(),
        };
      }
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (state.amountInput.type === AdjustIsolatedMarginInputType.PERCENT) {
        const parsedPercent = stringToNumberStringOrUndefined(state.amountInput.percent);
        return {
          amount:
            maxTransfer != null && parsedPercent != null
              ? MustBigNumber(parsedPercent).times(maxTransfer).toString()
              : undefined,
          percent: parsedPercent,
          maxAmount: MaybeBigNumber(maxTransfer)?.toString(),
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

class AdjustIsolatedMarginFormValidationErrors {
  private createError({
    code,
    type,
    fields,
    titleKey,
    textKey,
  }: {
    code: string;
    type: ErrorType;
    fields?: string[];
    titleKey?: string;
    textKey?: string;
  }): ValidationError {
    return {
      code,
      type,
      fields,
      action: null,
      link: null,
      linkText: null,
      resources: {
        title: titleKey
          ? {
              stringKey: titleKey,
            }
          : undefined,
        text: textKey
          ? {
              stringKey: textKey,
            }
          : undefined,
        action: null,
      },
    };
  }

  amountEmpty(): ValidationError {
    return this.createError({
      code: 'AMOUNT_EMPTY',
      type: ErrorType.error,
      fields: ['amount'],
      titleKey: STRING_KEYS.ENTER_AMOUNT,
    });
  }

  accountDataMissing(canViewAccount?: boolean): ValidationError {
    return this.createError({
      code: 'ACCOUNT_DATA_MISSING',
      type: ErrorType.error,
      titleKey:
        canViewAccount != null && canViewAccount
          ? STRING_KEYS.NOT_ALLOWED
          : STRING_KEYS.CONNECT_WALLET,
    });
  }

  noIsolatedPosition(): ValidationError {
    return this.createError({
      code: 'NO_ISOLATED_POSITION',
      type: ErrorType.error,
      titleKey: STRING_KEYS.UNKNOWN_ERROR,
    });
  }

  invalidSubaccountNumber(): ValidationError {
    return this.createError({
      code: 'INVALID_SUBACCOUNT_NUMBER',
      type: ErrorType.error,
      titleKey: STRING_KEYS.UNKNOWN_ERROR,
      textKey: STRING_KEYS.UNKNOWN_ERROR,
    });
  }

  noAfterData(): ValidationError {
    return this.createError({
      code: 'COULDNT_COMPUTE_POST_OPERATION',
      type: ErrorType.error,
      titleKey: STRING_KEYS.UNKNOWN_ERROR,
      textKey: STRING_KEYS.UNKNOWN_ERROR,
    });
  }

  noBeforeData(): ValidationError {
    return this.createError({
      code: 'COULDNT_COMPUTE_PRE_OPERATION',
      type: ErrorType.error,
      titleKey: STRING_KEYS.UNKNOWN_ERROR,
      textKey: STRING_KEYS.UNKNOWN_ERROR,
    });
  }

  addMoreThanFreeCollateral(): ValidationError {
    return this.createError({
      code: 'TRANSFER_MORE_THAN_FREE',
      type: ErrorType.error,
      fields: ['amount'],
      titleKey: STRING_KEYS.TRANSFER_MORE_THAN_FREE,
    });
  }

  invalidNewPositionLeverage(): ValidationError {
    return this.createError({
      code: 'INVALID_NEW_POSITION_LEVERAGE',
      type: ErrorType.error,
      fields: ['amount'],
      titleKey: STRING_KEYS.INVALID_NEW_POSITION_LEVERAGE,
    });
  }
}

const errors = new AdjustIsolatedMarginFormValidationErrors();

function getErrors(
  state: AdjustIsolatedMarginFormState,
  inputs: InputData,
  summary: SummaryData
): ValidationError[] {
  const validationErrors: ValidationError[] = [];

  if (inputs.rawParentSubaccountData == null || inputs.rawRelevantMarkets == null) {
    validationErrors.push(errors.accountDataMissing(inputs.canViewAccount));
  }

  // must be valid isolated child subaccount number
  if (
    state.childSubaccountNumber == null ||
    state.childSubaccountNumber === 0 ||
    state.childSubaccountNumber % NUM_PARENT_SUBACCOUNTS !== 0
  ) {
    validationErrors.push(errors.invalidSubaccountNumber());
  }

  const inputSummary = summary.inputs;
  const amount = MustBigNumber(inputSummary.amount);
  if (!amount.isFinite() || amount.isZero()) {
    validationErrors.push(errors.amountEmpty());
  }

  const beforeDetails = summary.accountBefore;
  const afterDetails = summary.accountAfter;

  if (beforeDetails.positionMargin == null || beforeDetails.positionMargin === 0) {
    validationErrors.push(errors.noIsolatedPosition());
  }

  if (amount.gt(inputSummary.maxAmount ?? 0)) {
    if (state.type === AdjustIsolatedMarginType.ADD) {
      validationErrors.push(errors.addMoreThanFreeCollateral());
    } else {
      validationErrors.push(errors.invalidNewPositionLeverage());
    }
  }

  if (afterDetails.crossFreeCollateral == null || afterDetails.positionMargin == null) {
    validationErrors.push(errors.noAfterData());
  }

  if (beforeDetails.crossFreeCollateral == null || beforeDetails.positionMargin == null) {
    validationErrors.push(errors.noBeforeData());
  }

  return validationErrors;
}

export const AdjustIsolatedMarginFormFns = createForm({
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
  const relevantPosition = relevantPositions.at(0)!;
  return {
    crossFreeCollateral: calculatedAccount.freeCollateral.toNumber(),
    crossMarginUsage: calculatedAccount.marginUsage?.toNumber(),
    positionMargin: relevantPosition.marginValueMaintenance.toNumber(),
    liquidationPrice: relevantPosition.liquidationPrice?.toNumber(),
    positionLeverage: relevantPosition.leverage?.toNumber(),
    positionMaintenanceRisk: relevantPosition.maintenanceRisk.toNumber(),
    positionMaxMarketLeverage: relevantPosition.maxLeverage?.toNumber(),
    positionNotional: relevantPosition.notional.toNumber(),
  };
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
