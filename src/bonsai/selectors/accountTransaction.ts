import { AMOUNT_SAFE_GAS_FOR_TRANSACTION_USDC } from '@/constants/account';

import { calculateIsAccountViewOnly } from '@/state/accountCalculators';
import { createAppSelector } from '@/state/appTypes';
import { getLocalWalletNonce, getSourceAccount } from '@/state/walletSelectors';

import { isBlockedGeo } from '@/lib/compliance';
import { localWalletManager } from '@/lib/hdKeyManager';
import { MaybeBigNumber } from '@/lib/numbers';

import { BonsaiCore } from '../ontology';
import { selectParentSubaccountInfo } from '../socketSelectors';
import { ComplianceStatus } from '../types/summaryTypes';

/**
 * @description Returns an account that is restriction-free and authorized for all transactions
 */
export const selectTxAuthorizedAccount = createAppSelector(
  [
    selectParentSubaccountInfo,
    getSourceAccount,
    calculateIsAccountViewOnly,
    BonsaiCore.compliance.data,
    getLocalWalletNonce,
  ],
  (parentSubaccountInfo, sourceAccount, isAccountViewOnly, complianceData, localWalletNonce) => {
    const isAccountRestrictionFree =
      !isAccountViewOnly &&
      ![
        ComplianceStatus.BLOCKED,
        ComplianceStatus.CLOSE_ONLY,
        ComplianceStatus.FIRST_STRIKE_CLOSE_ONLY,
      ].includes(complianceData.status) &&
      complianceData.geo &&
      !isBlockedGeo(complianceData.geo);

    if (!parentSubaccountInfo.wallet || !isAccountRestrictionFree || localWalletNonce == null) {
      return undefined;
    }

    const localDydxWallet = localWalletManager.getLocalWallet(localWalletNonce);
    const isCorrectWallet = localDydxWallet?.address === parentSubaccountInfo.wallet;
    const canWalletTransact = Boolean(localDydxWallet && isCorrectWallet);

    if (!canWalletTransact) return undefined;

    return {
      localDydxWallet,
      sourceAccount,
      parentSubaccountInfo,
    };
  }
);

/**
 * @description Returns an account that is authorized for actions that are available when in close-only mode
 */
export const selectTxAuthorizedCloseOnlyAccount = createAppSelector(
  [
    selectParentSubaccountInfo,
    getSourceAccount,
    calculateIsAccountViewOnly,
    BonsaiCore.compliance.data,
    getLocalWalletNonce,
  ],
  (parentSubaccountInfo, sourceAccount, isAccountViewOnly, complianceData, localWalletNonce) => {
    const isAccountRestrictionFree =
      !isAccountViewOnly && complianceData.status !== ComplianceStatus.BLOCKED;

    if (!parentSubaccountInfo.wallet || !isAccountRestrictionFree || localWalletNonce == null) {
      return undefined;
    }

    const localDydxWallet = localWalletManager.getLocalWallet(localWalletNonce);
    const isCorrectWallet = localDydxWallet?.address === parentSubaccountInfo.wallet;
    const canWalletTransact = Boolean(localDydxWallet && isCorrectWallet);

    if (!canWalletTransact) return undefined;

    return {
      localDydxWallet,
      sourceAccount,
      parentSubaccountInfo,
    };
  }
);

/**
 * @description Returns true if the user's wallet has enough USDC to pay gas for a transaction
 */
export const selectUserHasUsdcGasForTransaction = createAppSelector(
  [BonsaiCore.account.balances.data],
  (balances) => {
    const usdcBalance = balances.usdcAmount;
    const usdcBalanceBN = MaybeBigNumber(usdcBalance);

    if (usdcBalanceBN == null) {
      return false;
    }

    return usdcBalanceBN.gte(AMOUNT_SAFE_GAS_FOR_TRANSACTION_USDC);
  }
);
