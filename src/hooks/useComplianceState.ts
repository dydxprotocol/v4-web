import { shallowEqual, useSelector } from 'react-redux';

import { ComplianceStatus } from '@/constants/abacus';
import { ComplianceStates } from '@/constants/compliance';
import { STRING_KEYS } from '@/constants/localization';
import { isMainnet } from '@/constants/networks';

import { getComplianceStatus, getGeo } from '@/state/accountSelectors';

import { isBlockedGeo } from '@/lib/compliance';

import { useStringGetter } from './useStringGetter';

export const useComplianceState = () => {
  const stringGetter = useStringGetter();
  const complianceStatus = useSelector(getComplianceStatus, shallowEqual);
  const geo = useSelector(getGeo, shallowEqual);

  let complianceState = ComplianceStates.FULL_ACCESS;

  let complianceMessage;

  if (
    complianceStatus === ComplianceStatus.FIRST_STRIKE_CLOSE_ONLY ||
    complianceStatus === ComplianceStatus.CLOSE_ONLY
  ) {
    complianceState = ComplianceStates.CLOSE_ONLY;
  } else if (
    complianceStatus === ComplianceStatus.BLOCKED ||
    (geo && isBlockedGeo(geo) && isMainnet)
  ) {
    complianceState = ComplianceStates.READ_ONLY;
  }

  if (complianceStatus === ComplianceStatus.FIRST_STRIKE_CLOSE_ONLY) {
    complianceMessage = `${stringGetter({ key: STRING_KEYS.CLICK_TO_VIEW })} →`;
  } else if (complianceStatus === ComplianceStatus.CLOSE_ONLY) {
    // TODO: add email and date to STRING_KEYS.CLOSE_ONLY_MESSAGE
    complianceMessage = stringGetter({ key: STRING_KEYS.CLOSE_ONLY_MESSAGE });
  } else if (complianceStatus === ComplianceStatus.BLOCKED) {
    // TODO: add email to STRING_KEYS.PERMANENTLY_BLOCKED_MESSAGE
    complianceMessage = stringGetter({ key: STRING_KEYS.PERMANENTLY_BLOCKED_MESSAGE });
  } else if (geo && isBlockedGeo(geo)) {
    complianceMessage = stringGetter({ key: STRING_KEYS.BLOCKED_MESSAGE });
  }

  return {
    geo,
    complianceStatus,
    complianceState,
    complianceMessage,
  };
};
