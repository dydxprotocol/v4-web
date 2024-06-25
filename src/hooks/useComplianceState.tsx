import { shallowEqual } from 'react-redux';
<<<<<<< HEAD
=======
>>>>>>> d685f9a7c9c38572fdfbb748a20dde1b2778fb7b

import { ComplianceStatus } from '@/constants/abacus';
import { CLOSE_ONLY_GRACE_PERIOD, ComplianceStates } from '@/constants/compliance';
import { STRING_KEYS } from '@/constants/localization';
import { isMainnet } from '@/constants/networks';
<<<<<<< HEAD
=======

import { layoutMixins } from '@/styles/layoutMixins';

import { Link } from '@/components/Link';
>>>>>>> d685f9a7c9c38572fdfbb748a20dde1b2778fb7b

import { getComplianceStatus, getComplianceUpdatedAt, getGeo } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';
import { getSelectedLocale } from '@/state/localizationSelectors';

import { isBlockedGeo } from '@/lib/compliance';

import { TermsOfUseLink } from '@/components/TermsOfUseLink';
import { useStringGetter } from './useStringGetter';
import { useURLConfigs } from './useURLConfigs';

export const useComplianceState = () => {
  const stringGetter = useStringGetter();
  const complianceStatus = useAppSelector(getComplianceStatus, shallowEqual);
  const complianceUpdatedAt = useAppSelector(getComplianceUpdatedAt);
  const geo = useAppSelector(getGeo);
  const selectedLocale = useAppSelector(getSelectedLocale);

  const updatedAtDate = complianceUpdatedAt ? new Date(complianceUpdatedAt) : undefined;
  updatedAtDate?.setDate(updatedAtDate.getDate() + CLOSE_ONLY_GRACE_PERIOD);

  const { complianceSupportEmail } = useURLConfigs();

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
    complianceMessage = stringGetter({
      key: STRING_KEYS.CLOSE_ONLY_MESSAGE,
      params: {
        DATE: updatedAtDate
          ? updatedAtDate.toLocaleString(selectedLocale, {
              dateStyle: 'medium',
              timeStyle: 'short',
            })
          : undefined,
        EMAIL: complianceSupportEmail,
      },
    });
  } else if (complianceStatus === ComplianceStatus.BLOCKED) {
    complianceMessage = stringGetter({
      key: STRING_KEYS.PERMANENTLY_BLOCKED_MESSAGE,
      params: { EMAIL: complianceSupportEmail },
    });
  } else if (geo && isBlockedGeo(geo)) {
    complianceMessage = stringGetter({
      key: STRING_KEYS.BLOCKED_MESSAGE,
      params: {
        TERMS_OF_USE_LINK: (
          <TermsOfUseLink isInline />
        ),
      },
    });
  }

  return {
    geo,
    complianceStatus,
    complianceState,
    complianceMessage,
  };
};