import { VaultModule } from '@dydxprotocol/v4-client-js';

import { STRING_KEYS } from '@/constants/localization';

import { ToPrimitives } from '@/lib/abacus/parseToPrimitives';
import { MustBigNumber } from '@/lib/numbers';

import { ErrorType, simpleValidationError, ValidationError } from '../lib/validationErrors';
import { VaultAccount } from './vaultAccount';

export interface VaultFormData {
  action: VaultFormAction;
  amount?: number;
  acknowledgedSlippage: boolean;
  acknowledgedTerms: boolean;
  inConfirmationStep: boolean;
}

export enum VaultFormAction {
  DEPOSIT = 'DEPOSIT',
  WITHDRAW = 'WITHDRAW',
}

export interface VaultFormAccountData {
  marginUsage?: number;
  freeCollateral?: number;
  canViewAccount?: boolean;
}

export interface VaultDepositWithdrawSubmissionData {
  deposit?: VaultDepositData;
  withdraw?: VaultWithdrawData;
}

export interface VaultDepositData {
  subaccountFrom: string;
  amount: number;
}

export interface VaultWithdrawData {
  subaccountTo: string;
  shares: number;
  minAmount: number;
}

export interface VaultFormSummaryData {
  needSlippageAck?: boolean;
  needTermsAck?: boolean;
  marginUsage?: number;
  freeCollateral?: number;
  vaultBalance?: number;
  withdrawableVaultBalance?: number;
  estimatedSlippage?: number;
  estimatedAmountReceived?: number;
}

export interface VaultFormValidationResult {
  errors: ValidationError[];
  submissionData?: VaultDepositWithdrawSubmissionData;
  summaryData: VaultFormSummaryData;
}

class VaultFormValidationErrors {
  amountEmpty(operation: VaultFormAction): ValidationError {
    return simpleValidationError({
      code: 'AMOUNT_EMPTY',
      type: ErrorType.error,
      fields: ['amount'],
      titleKey:
        operation === VaultFormAction.DEPOSIT
          ? STRING_KEYS.ENTER_AMOUNT_TO_DEPOSIT
          : STRING_KEYS.ENTER_AMOUNT_TO_WITHDRAW,
    });
  }

  accountDataMissing(canViewAccount?: boolean): ValidationError {
    return simpleValidationError({
      code: 'ACCOUNT_DATA_MISSING',
      type: ErrorType.error,
      titleKey:
        canViewAccount != null && canViewAccount
          ? STRING_KEYS.NOT_ALLOWED
          : STRING_KEYS.CONNECT_WALLET,
    });
  }

  depositTooHigh(): ValidationError {
    return simpleValidationError({
      code: 'DEPOSIT_TOO_HIGH',
      type: ErrorType.error,
      fields: ['amount'],
      titleKey: STRING_KEYS.MODIFY_SIZE_FIELD,
      textKey: STRING_KEYS.DEPOSIT_TOO_HIGH,
    });
  }

  depositTooLow(): ValidationError {
    return simpleValidationError({
      code: 'DEPOSIT_TOO_LOW',
      type: ErrorType.error,
      fields: ['amount'],
      titleKey: STRING_KEYS.MODIFY_SIZE_FIELD,
      textKey: STRING_KEYS.DEPOSIT_TOO_LOW,
    });
  }

  withdrawTooHigh(): ValidationError {
    return simpleValidationError({
      code: 'WITHDRAW_TOO_HIGH',
      type: ErrorType.error,
      fields: ['amount'],
      titleKey: STRING_KEYS.MODIFY_SIZE_FIELD,
      textKey: STRING_KEYS.WITHDRAW_TOO_HIGH,
    });
  }

  withdrawTooLow(): ValidationError {
    return simpleValidationError({
      code: 'WITHDRAW_TOO_LOW',
      type: ErrorType.error,
      fields: ['amount'],
      titleKey: STRING_KEYS.MODIFY_SIZE_FIELD,
      textKey: STRING_KEYS.WITHDRAW_TOO_LOW,
    });
  }

  withdrawingLockedBalance(): ValidationError {
    return simpleValidationError({
      code: 'WITHDRAWING_LOCKED_BALANCE',
      type: ErrorType.error,
      fields: ['amount'],
      titleKey: STRING_KEYS.MODIFY_SIZE_FIELD,
      textKey: STRING_KEYS.WITHDRAW_TOO_HIGH,
    });
  }

  slippageTooHigh(): ValidationError {
    return simpleValidationError({
      code: 'SLIPPAGE_TOO_HIGH',
      type: ErrorType.warning,
      textKey: STRING_KEYS.SLIPPAGE_WARNING,
    });
  }

  mustAckSlippage(): ValidationError {
    return simpleValidationError({
      code: 'MUST_ACK_SLIPPAGE',
      type: ErrorType.error,
      fields: ['acknowledgeSlippage'],
      titleKey: STRING_KEYS.ACKNOWLEDGE_HIGH_SLIPPAGE,
    });
  }

  mustAckTerms(): ValidationError {
    return simpleValidationError({
      code: 'MUST_ACK_TERMS',
      type: ErrorType.error,
      fields: ['acknowledgeTerms'],
      titleKey: STRING_KEYS.ACKNOWLEDGE_MEGAVAULT_TERMS,
    });
  }

  vaultAccountMissing(): ValidationError {
    return simpleValidationError({
      code: 'VAULT_ACCOUNT_MISSING',
      type: ErrorType.error,
    });
  }

  slippageResponseMissing(): ValidationError {
    return simpleValidationError({
      code: 'SLIPPAGE_RESPONSE_MISSING',
      type: ErrorType.error,
    });
  }

  slippageResponseWrongShares(): ValidationError {
    return simpleValidationError({
      code: 'SLIPPAGE_RESPONSE_WRONG_SHARES',
      type: ErrorType.error,
    });
  }
}

// Constants
const SLIPPAGE_PERCENT_WARN = 0.02;
const SLIPPAGE_PERCENT_ACK = 0.04;
const SLIPPAGE_TOLERANCE = 0.01;
const EPSILON_FOR_ERRORS = 0.0001;
const MIN_DEPOSIT_FE_THRESHOLD = 5.0;

export function calculateSharesToWithdraw(
  vaultAccount: VaultAccount | undefined,
  amount: number
): number {
  const shareValue = vaultAccount?.shareValue ?? 0;
  if (shareValue === 0) {
    return 0;
  }

  const amountToUse =
    vaultAccount?.withdrawableUsdc != null &&
    vaultAccount.withdrawableUsdc - amount >= -EPSILON_FOR_ERRORS &&
    vaultAccount.withdrawableUsdc - amount <= 0.01
      ? vaultAccount.withdrawableUsdc
      : amount;

  return Math.floor(amountToUse / shareValue);
}

type OnChainSlippageResponse = ToPrimitives<VaultModule.QueryMegavaultWithdrawalInfoResponse>;

export function validateVaultForm(
  formData: VaultFormData,
  accountData?: VaultFormAccountData,
  vaultAccount?: VaultAccount,
  slippageResponse?: OnChainSlippageResponse
): VaultFormValidationResult {
  const errors = new VaultFormValidationErrors();
  const validationErrors: ValidationError[] = [];
  let submissionData: VaultDepositWithdrawSubmissionData | undefined;

  const sharesToAttemptWithdraw =
    formData.action === VaultFormAction.WITHDRAW &&
    vaultAccount != null &&
    (vaultAccount.shareValue ?? 0) > 0 &&
    formData.amount != null
      ? calculateSharesToWithdraw(vaultAccount, formData.amount)
      : undefined;

  const amount =
    formData.action === VaultFormAction.DEPOSIT
      ? formData.amount ?? 0
      : sharesToAttemptWithdraw != null
        ? sharesToAttemptWithdraw * (vaultAccount?.shareValue ?? 0)
        : formData.amount ?? 0;

  const withdrawnAmountIncludingSlippage =
    slippageResponse?.expectedQuoteQuantums != null
      ? MustBigNumber(slippageResponse.expectedQuoteQuantums).dividedBy(1_000_000).toNumber()
      : undefined;

  const postOpVaultBalance =
    (vaultAccount?.balanceUsdc ?? 0) +
    (formData.action === VaultFormAction.DEPOSIT ? amount : -amount);

  const postOpWithdrawableVaultBalance =
    (vaultAccount?.withdrawableUsdc ?? 0) +
    (formData.action === VaultFormAction.DEPOSIT ? amount : -amount);

  // Calculate margin and collateral changes
  const [postOpFreeCollateral, postOpMarginUsage] = (() => {
    if (accountData?.freeCollateral != null && accountData.marginUsage != null) {
      const equity = accountData.freeCollateral / (1 - accountData.marginUsage);

      const postOpEquity =
        formData.action === VaultFormAction.DEPOSIT
          ? equity - amount
          : withdrawnAmountIncludingSlippage != null
            ? equity + withdrawnAmountIncludingSlippage
            : undefined;

      const newFreeCollateral =
        formData.action === VaultFormAction.DEPOSIT
          ? accountData.freeCollateral - amount
          : withdrawnAmountIncludingSlippage != null
            ? accountData.freeCollateral + withdrawnAmountIncludingSlippage
            : undefined;

      const newMarginUsage =
        newFreeCollateral != null && postOpEquity != null && postOpEquity > 0
          ? 1 - newFreeCollateral / postOpEquity
          : undefined;

      return [newFreeCollateral, newMarginUsage];
    }
    return [undefined, undefined];
  })();

  // Calculate slippage metrics
  const slippagePercent =
    formData.action === VaultFormAction.WITHDRAW &&
    amount > 0 &&
    withdrawnAmountIncludingSlippage != null
      ? 1 - withdrawnAmountIncludingSlippage / amount
      : 0;

  const needSlippageAck = slippagePercent >= SLIPPAGE_PERCENT_ACK && formData.inConfirmationStep;
  const needTermsAck = formData.action === VaultFormAction.DEPOSIT && formData.inConfirmationStep;

  // Perform validations
  if (accountData == null) {
    validationErrors.push(errors.accountDataMissing());
  }

  if (amount === 0) {
    validationErrors.push(errors.amountEmpty(formData.action));
  }

  if (formData.inConfirmationStep) {
    if (formData.action === VaultFormAction.WITHDRAW) {
      if (vaultAccount == null) {
        validationErrors.push(errors.vaultAccountMissing());
      }
      if (
        slippageResponse == null ||
        slippageResponse.sharesToWithdraw == null ||
        sharesToAttemptWithdraw == null
      ) {
        validationErrors.push(errors.slippageResponseMissing());
      }
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    } else if (formData.action === VaultFormAction.DEPOSIT) {
      if (accountData?.marginUsage == null || accountData.freeCollateral == null) {
        validationErrors.push(errors.accountDataMissing(accountData?.canViewAccount));
      }
    }
  }

  if (needTermsAck && !formData.acknowledgedTerms) {
    validationErrors.push(errors.mustAckTerms());
  }

  // Action-specific validations
  if (formData.action === VaultFormAction.DEPOSIT) {
    if (postOpFreeCollateral != null && postOpFreeCollateral < -EPSILON_FOR_ERRORS) {
      validationErrors.push(errors.depositTooHigh());
    }
    if (amount > 0 && amount < MIN_DEPOSIT_FE_THRESHOLD) {
      validationErrors.push(errors.depositTooLow());
    }
  } else {
    if (postOpVaultBalance < -EPSILON_FOR_ERRORS) {
      validationErrors.push(errors.withdrawTooHigh());
    }

    if (amount > 0 && amount < MIN_DEPOSIT_FE_THRESHOLD) {
      const isWithdrawingEntireBalance =
        vaultAccount?.withdrawableUsdc != null &&
        Math.abs(vaultAccount.withdrawableUsdc - amount) <= 0.01;

      if (!isWithdrawingEntireBalance) {
        validationErrors.push(errors.withdrawTooLow());
      }
    }

    if (
      postOpVaultBalance >= -EPSILON_FOR_ERRORS &&
      amount > 0 &&
      vaultAccount?.withdrawableUsdc != null &&
      vaultAccount.withdrawableUsdc - amount < -EPSILON_FOR_ERRORS
    ) {
      validationErrors.push(errors.withdrawingLockedBalance());
    }

    if (
      sharesToAttemptWithdraw != null &&
      slippageResponse?.sharesToWithdraw?.numShares != null &&
      sharesToAttemptWithdraw !==
        MustBigNumber(slippageResponse.sharesToWithdraw.numShares).toNumber()
    ) {
      validationErrors.push(errors.slippageResponseWrongShares());
    }

    if (slippagePercent >= SLIPPAGE_PERCENT_WARN) {
      validationErrors.push(errors.slippageTooHigh());
    }

    if (needSlippageAck && !formData.acknowledgedSlippage && formData.inConfirmationStep) {
      validationErrors.push(errors.mustAckSlippage());
    }
  }

  // Prepare submission data if no blocking errors
  if (!validationErrors.some((error) => error.type === ErrorType.error)) {
    submissionData =
      formData.action === VaultFormAction.DEPOSIT
        ? {
            deposit: {
              subaccountFrom: '0',
              amount,
            },
            withdraw: undefined,
          }
        : {
            deposit: undefined,
            withdraw:
              sharesToAttemptWithdraw != null &&
              sharesToAttemptWithdraw > 0 &&
              withdrawnAmountIncludingSlippage != null
                ? {
                    subaccountTo: '0',
                    shares: sharesToAttemptWithdraw,
                    minAmount: withdrawnAmountIncludingSlippage * (1 - SLIPPAGE_TOLERANCE),
                  }
                : undefined,
          };
  }

  // Prepare summary data
  const summaryData: VaultFormSummaryData = {
    needSlippageAck,
    needTermsAck,
    marginUsage: postOpMarginUsage,
    freeCollateral: postOpFreeCollateral,
    vaultBalance: postOpVaultBalance,
    withdrawableVaultBalance: postOpWithdrawableVaultBalance,
    estimatedSlippage: slippagePercent,
    estimatedAmountReceived:
      formData.action === VaultFormAction.WITHDRAW ? withdrawnAmountIncludingSlippage : undefined,
  };

  return {
    errors: validationErrors,
    submissionData,
    summaryData,
  };
}
