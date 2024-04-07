import { shallowEqual, useSelector } from 'react-redux';

import { ComplianceStatus } from '@/constants/abacus';
import { ComplianceStates } from '@/constants/compliance';
import { BLOCKED_COUNTRIES, CountryCodes, OFAC_SANCTIONED_COUNTRIES } from '@/constants/geo';
import { STRING_KEYS } from '@/constants/localization';

import { getComplianceStatus, getGeo } from '@/state/accountSelectors';

import { useStringGetter } from './useStringGetter';

export const useComplianceState = () => {
  const stringGetter = useStringGetter();
  const complianceStatus = useSelector(getComplianceStatus, shallowEqual);
  const geo = useSelector(getGeo, shallowEqual);

  let complianceState = ComplianceStates.FULLACCESS;

  let complianceMessage;

  if (
    complianceStatus === ComplianceStatus.FIRST_STRIKE ||
    complianceStatus === ComplianceStatus.CLOSE_ONLY
  ) {
    complianceState = ComplianceStates.CLOSE_ONLY;
  } else if (
    complianceStatus === ComplianceStatus.BLOCKED ||
    (geo && [...BLOCKED_COUNTRIES, ...OFAC_SANCTIONED_COUNTRIES].includes(geo as CountryCodes))
  ) {
    complianceState = ComplianceStates.READ_ONLY;
  }

  if (complianceStatus === ComplianceStatus.FIRST_STRIKE) {
    complianceMessage = 'Click to view →';
  } else if (complianceStatus === ComplianceStatus.CLOSE_ONLY) {
    complianceMessage =
      'Because you appear to be a resident of, or trading from, a jurisdiction that violates our terms of use, or have engaged in activity that violates our terms of use, you have been blocked. You have until {DATE RETURNED FROM INDEXER} to withdraw your funds before your access to the frontend is blocked. If you believe there has been an error, please email {CONFIG EMAIL}.';
  } else if (complianceStatus === ComplianceStatus.BLOCKED) {
    complianceMessage =
      'Because you appear to be a resident of, or trading from, a jurisdiction that violates our terms of use and previously have been given an opportunity to redress circumstances that led to restrictions on your account, you have been permanently blocked. If you believe there has been an error, please email {CONFIG EMAIL}.';
  } else if (
    geo &&
    [...BLOCKED_COUNTRIES, ...OFAC_SANCTIONED_COUNTRIES].includes(geo as CountryCodes)
  ) {
    complianceMessage =
      'Perpetuals are not available to any persons who are residents of, are located or incorporated in, or have a registered agent in a blocked country or a restricted territory. More details can be found in our Terms of Use [LINK]';
  }

  return {
    geo,
    complianceStatus,
    complianceState,
    complianceMessage,
  };
};
