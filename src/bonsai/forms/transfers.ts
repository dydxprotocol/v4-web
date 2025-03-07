import { validation } from '@dydxprotocol/v4-client-js';

import { STRING_KEYS } from '@/constants/localization';
import { TOKEN_DECIMALS, USD_DECIMALS } from '@/constants/numbers';

import { assertNever } from '@/lib/assertNever';
import { calc, mapIfPresent } from '@/lib/do';
import { AttemptBigNumber, AttemptNumber, BIG_NUMBERS, MustBigNumber } from '@/lib/numbers';

import {
  applyOperationsToSubaccount,
  createBatchedOperations,
} from '../calculators/accountActions';
import { convertAmount } from '../calculators/balances';
import { calculateParentSubaccountSummary } from '../calculators/subaccount';
import { createForm, createVanillaReducer } from '../lib/forms';
import {
  ErrorFormat,
  ErrorType,
  simpleValidationError,
  ValidationError,
} from '../lib/validationErrors';
import { SubaccountOperations } from '../types/operationTypes';
import { MarketsData, ParentSubaccountDataBase } from '../types/rawTypes';
import { AccountBalances } from '../types/summaryTypes';

export interface TransferFormState {
  amountInput:
    | { type: TransferToken.USDC; amount: string }
    | { type: TransferToken.NATIVE; amount: string };
  recipientAddress: string; // Required for transferOut
  memo?: string; // Optional note/memo for the transfer
}

export enum TransferToken {
  USDC = 'usdc',
  NATIVE = 'chain', // The native token is referred to as 'chain' in the code
}

const initialState: TransferFormState = {
  amountInput: {
    type: TransferToken.USDC,
    amount: '',
  },
  recipientAddress: '',
  memo: '',
};

const reducer = createVanillaReducer({
  initialState,
  actions: {
    setUsdcAmount: (state, amount: string) => ({
      ...state,
      amountInput: {
        type: TransferToken.USDC,
        amount,
      },
    }),
    setNativeAmount: (state, amount: string) => ({
      ...state,
      amountInput: {
        type: TransferToken.NATIVE,
        amount,
      },
    }),
    setRecipientAddress: (state, recipientAddress: string) => ({
      ...state,
      recipientAddress,
    }),
    setMemo: (state, memo: string) => ({
      ...state,
      memo,
    }),
    resetAmount: (state) => ({
      ...state,
      amountInput: initialState.amountInput,
    }),
    reset: () => initialState,
  },
});

export interface TransferFormInputData {
  rawParentSubaccountData: ParentSubaccountDataBase | undefined;
  rawRelevantMarkets: MarketsData | undefined;
  walletBalances: AccountBalances | undefined;
  feeResult: TransferFeeData | undefined; // Fee data provided by consumer
  canViewAccount: boolean | undefined;
  display: {
    usdcName: string;
    usdcDecimals: number;
    usdcDenom: string;
    nativeName: string;
    nativeDecimals: number;
    nativeDenom: string;
  };
}

export interface TransferFeeData {
  amount: string | undefined;
  denom: string | undefined;
  requestedFor: TransferFormState['amountInput'];
}

interface AccountDetails {
  availableNativeBalance?: number;
  equity?: number;
  freeCollateral?: number;
  leverage?: number;
}

interface InputSummary {
  token: TransferToken;
  amount?: string;
  recipientAddress: string;
  memo?: string;
}

interface TransferUsdcPayload {
  type: TransferToken.USDC;
  amount: number;
  recipient: string;
}

interface TransferNativeTokenPayload {
  type: TransferToken.NATIVE;
  amount: number;
  recipient: string;
  memo?: string;
}

export type TransferPayload = TransferUsdcPayload | TransferNativeTokenPayload;

export interface TransferSummaryData {
  accountBefore: AccountDetails;
  accountAfter: AccountDetails;
  inputs: InputSummary;
  payload: TransferPayload | undefined;
  fee: string | undefined;
  feeDenom: TransferToken | undefined;
}

function calculateSummary(
  state: TransferFormState,
  inputData: TransferFormInputData
): TransferSummaryData {
  const accountBefore = getAccountDetails(
    inputData.rawParentSubaccountData,
    inputData.rawRelevantMarkets,
    inputData.walletBalances
  );

  const parsedAmount = AttemptBigNumber(state.amountInput.amount);

  const inputs: InputSummary = {
    token: state.amountInput.type,
    amount: parsedAmount?.toString(),
    recipientAddress: state.recipientAddress,
    memo: state.memo,
  };

  const feeDenom =
    inputData.feeResult?.denom == null
      ? undefined
      : inputData.feeResult.denom === inputData.display.usdcDenom
        ? TransferToken.USDC
        : TransferToken.NATIVE;

  const usingUsdcForGas = feeDenom === TransferToken.USDC;

  const parsedFee = calc(() => {
    if (!inputData.feeResult) {
      return undefined;
    }

    // must match the current token and amount
    const isRequestMatchingCurrentInput =
      inputData.feeResult.requestedFor.type === state.amountInput.type &&
      parsedAmount != null &&
      AttemptBigNumber(inputData.feeResult.requestedFor.amount)?.eq(parsedAmount);

    const attemptFee = isRequestMatchingCurrentInput
      ? AttemptBigNumber(inputData.feeResult.amount)
      : undefined;

    if (attemptFee == null) {
      return attemptFee;
    }

    return convertAmount(
      inputData.feeResult.amount,
      usingUsdcForGas ? inputData.display.usdcDecimals : inputData.display.nativeDecimals
    );
  });

  const payload = calc((): TransferPayload | undefined => {
    if (!parsedAmount || !state.recipientAddress || parsedAmount.lte(0)) {
      return undefined;
    }

    if (state.amountInput.type === TransferToken.USDC) {
      return {
        type: TransferToken.USDC,
        amount: parsedAmount.toNumber(),
        recipient: state.recipientAddress,
      };
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (state.amountInput.type === TransferToken.NATIVE) {
      return {
        type: TransferToken.NATIVE,
        amount: parsedAmount.toNumber(),
        recipient: state.recipientAddress,
        memo: state.memo,
      };
    }

    assertNever(state.amountInput);
    return undefined;
  });

  const accountAfter = calc((): AccountDetails | undefined => {
    if (!parsedAmount) {
      return undefined;
    }
    const feeToUse = parsedFee ?? '0';

    if (!inputData.rawParentSubaccountData || !inputData.rawRelevantMarkets) {
      return undefined;
    }

    const operations = calc(() => {
      if (inputData.rawParentSubaccountData == null) {
        return undefined;
      }

      if (state.amountInput.type === TransferToken.USDC) {
        const totalAmountLost = parsedAmount.plus(usingUsdcForGas ? feeToUse : MustBigNumber(0));

        return createBatchedOperations(
          SubaccountOperations.WithdrawUsdc({
            amount: totalAmountLost.toString(),
            subaccountNumber: inputData.rawParentSubaccountData.parentSubaccount,
          })
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (state.amountInput.type === TransferToken.NATIVE) {
        if (usingUsdcForGas) {
          return createBatchedOperations(
            SubaccountOperations.WithdrawUsdc({
              amount: feeToUse.toString(),
              subaccountNumber: inputData.rawParentSubaccountData.parentSubaccount,
            })
          );
        }
        return undefined;
      }

      assertNever(state.amountInput);
      return undefined;
    });

    const modifiedSubaccountData = operations
      ? applyOperationsToSubaccount(inputData.rawParentSubaccountData, operations)
      : inputData.rawParentSubaccountData;

    return {
      ...getAccountDetails(
        modifiedSubaccountData,
        inputData.rawRelevantMarkets,
        inputData.walletBalances
      ),
      availableNativeBalance: calc(() => {
        const currentBalanceBN = MustBigNumber(accountBefore.availableNativeBalance);
        const amountDeduction =
          state.amountInput.type === TransferToken.NATIVE ? parsedAmount : BIG_NUMBERS.ZERO;
        const feeDeduction = usingUsdcForGas ? BIG_NUMBERS.ZERO : feeToUse;

        return currentBalanceBN.minus(amountDeduction).minus(feeDeduction).toNumber();
      }),
    };
  });

  return {
    accountBefore,
    accountAfter: accountAfter ?? accountBefore,
    inputs,
    payload,
    fee: parsedFee?.toString(),
    feeDenom,
  };
}

function getAccountDetails(
  rawParentSubaccountData?: ParentSubaccountDataBase,
  rawRelevantMarkets?: MarketsData,
  rawWalletBalances?: AccountBalances
): AccountDetails {
  return {
    ...(mapIfPresent(rawParentSubaccountData, rawRelevantMarkets, (subaccountData, marketsData) => {
      const calculatedAccount = calculateParentSubaccountSummary(subaccountData, marketsData);
      return {
        equity: calculatedAccount.equity.toNumber(),
        freeCollateral: calculatedAccount.freeCollateral.toNumber(),
        leverage: calculatedAccount.leverage?.toNumber(),
      };
    }) ?? {}),
    ...(mapIfPresent(rawWalletBalances, (b) => ({
      availableNativeBalance: AttemptNumber(b.chainTokenAmount),
    })) ?? {}),
  };
}

class TransferFormValidationErrors {
  amountEmpty(): ValidationError {
    return simpleValidationError({
      code: 'AMOUNT_EMPTY',
      type: ErrorType.error,
      fields: ['amountInput.amount'],
    });
  }

  insufficientBalance(): ValidationError {
    return simpleValidationError({
      code: 'INSUFFICIENT_BALANCE',
      type: ErrorType.error,
      fields: ['amountInput.amount'],
      textKey: STRING_KEYS.INSUFFICIENT_BALANCE,
      titleKey: STRING_KEYS.MODIFY_SIZE_FIELD,
    });
  }

  addressEmpty(): ValidationError {
    return simpleValidationError({
      code: 'ADDRESS_EMPTY',
      type: ErrorType.error,
      fields: ['recipientAddress'],
      titleKey: STRING_KEYS.ENTER_VALID_ADDRESS,
    });
  }

  invalidAddress(): ValidationError {
    return simpleValidationError({
      code: 'INVALID_ADDRESS',
      type: ErrorType.error,
      fields: ['recipientAddress'],
      titleKey: STRING_KEYS.ENTER_VALID_ADDRESS,
      textKey: STRING_KEYS.TRANSFER_INVALID_DYDX_ADDRESS,
    });
  }

  transferToSelf(): ValidationError {
    return simpleValidationError({
      code: 'TRANSFER_TO_SELF',
      type: ErrorType.error,
      fields: ['recipientAddress'],
      titleKey: STRING_KEYS.ENTER_VALID_ADDRESS,
      textKey: STRING_KEYS.TRANSFER_TO_YOURSELF,
    });
  }

  missingMemo(): ValidationError {
    return simpleValidationError({
      code: 'MISSING_MEMO',
      type: ErrorType.warning,
      fields: ['memo'],
      textKey: STRING_KEYS.TRANSFER_WITHOUT_MEMO,
    });
  }

  insufficientUsdcGas(token: string, balance: number, decimals: number): ValidationError {
    return simpleValidationError({
      code: 'INSUFFICIENT_USDC_GAS',
      type: ErrorType.error,
      textKey: STRING_KEYS.TRANSFER_INSUFFICIENT_GAS,
      textParams: {
        TOKEN: { value: token, format: ErrorFormat.String },
        BALANCE: { value: balance, format: ErrorFormat.Size, decimals },
      },
    });
  }

  insufficientNativeGas(token: string, balance: number, decimals: number): ValidationError {
    return simpleValidationError({
      code: 'INSUFFICIENT_NATIVE_GAS',
      type: ErrorType.error,
      textKey: STRING_KEYS.TRANSFER_INSUFFICIENT_GAS,
      textParams: {
        TOKEN: { value: token, format: ErrorFormat.String },
        BALANCE: { value: balance, format: ErrorFormat.Size, decimals },
      },
    });
  }

  invalidFeeResponse(): ValidationError {
    return simpleValidationError({
      code: 'INVALID_FEE_RESPONSE',
      type: ErrorType.error,
    });
  }

  noPayload(): ValidationError {
    return simpleValidationError({
      code: 'MISSING_PAYLOAD',
      type: ErrorType.error,
    });
  }
}

const errors = new TransferFormValidationErrors();

export function getErrors(
  state: TransferFormState,
  inputData: TransferFormInputData,
  summary: TransferSummaryData
): ValidationError[] {
  const validationErrors: ValidationError[] = [];

  const amount = AttemptBigNumber(state.amountInput.amount);
  if (amount == null || amount.lte(0)) {
    validationErrors.push(errors.amountEmpty());
  }

  const availableBalance = calc(() => {
    if (state.amountInput.type === TransferToken.USDC) {
      return mapIfPresent(summary.accountBefore.freeCollateral, (fc) => MustBigNumber(fc));
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (state.amountInput.type === TransferToken.NATIVE) {
      return mapIfPresent(summary.accountBefore.availableNativeBalance, (b) => MustBigNumber(b));
    }
    assertNever(state.amountInput);
    return undefined;
  });

  if (amount != null && availableBalance != null && amount.gt(availableBalance)) {
    validationErrors.push(errors.insufficientBalance());
  }

  if (state.recipientAddress.trim().length === 0) {
    validationErrors.push(errors.addressEmpty());
  }
  if (state.recipientAddress === inputData.rawParentSubaccountData?.address) {
    validationErrors.push(errors.transferToSelf());
  } else if (!validation.isValidAddress(state.recipientAddress)) {
    validationErrors.push(errors.invalidAddress());
  }

  // Memo validation for native token transfers - add warning if memo is empty
  if (
    state.amountInput.type === TransferToken.NATIVE &&
    (!state.memo || state.memo.trim().length === 0)
  ) {
    validationErrors.push(errors.missingMemo());
  }

  if (
    inputData.feeResult == null ||
    inputData.feeResult.amount == null ||
    !(
      inputData.feeResult.requestedFor.type === state.amountInput.type &&
      amount != null &&
      AttemptBigNumber(inputData.feeResult.requestedFor.amount)?.eq(amount)
    )
  ) {
    validationErrors.push(errors.invalidFeeResponse());
  }

  // Gas fee validations - if post balance is less than 0 and there wasn't a balance error above it's because of gas fee
  if ((summary.accountAfter.freeCollateral ?? 0) < 0) {
    validationErrors.push(
      errors.insufficientUsdcGas(
        inputData.display.usdcName,
        summary.accountBefore.freeCollateral ?? 0,
        USD_DECIMALS
      )
    );
  }

  if ((summary.accountAfter.availableNativeBalance ?? 0) < 0) {
    validationErrors.push(
      errors.insufficientNativeGas(
        inputData.display.nativeName,
        summary.accountBefore.availableNativeBalance ?? 0,
        TOKEN_DECIMALS
      )
    );
  }

  if (!summary.payload) {
    validationErrors.push(errors.noPayload());
  }

  return validationErrors;
}

export const TransferFormFns = createForm({
  reducer,
  calculateSummary,
  getErrors,
});
