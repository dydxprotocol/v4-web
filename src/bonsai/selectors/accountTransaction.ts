import { calculateIsAccountViewOnly } from '@/state/accountCalculators';
import { createAppSelector } from '@/state/appTypes';
import { getLocalWalletNonce, getSourceAccount } from '@/state/walletSelectors';

import { isBlockedGeo } from '@/lib/compliance';
import { localWalletManager } from '@/lib/hdKeyManager';

import { BonsaiCore } from '../ontology';
import { selectParentSubaccountInfo } from '../socketSelectors';
import { ComplianceStatus } from '../types/summaryTypes';

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
