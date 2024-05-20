import { shallowEqual, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import { ComplianceStatus } from '@/constants/abacus';
import { CLOSE_ONLY_GRACE_PERIOD, ComplianceStates } from '@/constants/compliance';
import { STRING_KEYS } from '@/constants/localization';
import { isMainnet } from '@/constants/networks';

import { LinkOutIcon } from '@/icons';

import { getComplianceStatus, getComplianceUpdatedAt, getGeo } from '@/state/accountSelectors';
import { getSelectedLocale } from '@/state/localizationSelectors';

import { isBlockedGeo } from '@/lib/compliance';

import { useURLConfigs } from '.';
import { useStringGetter } from './useStringGetter';

export const useComplianceState = () => {
  const stringGetter = useStringGetter();
  const complianceStatus = useSelector(getComplianceStatus, shallowEqual);
  const complianceUpdatedAt = useSelector(getComplianceUpdatedAt);
  const geo = useSelector(getGeo);
  const selectedLocale = useSelector(getSelectedLocale);

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
    }) as string;
  } else if (complianceStatus === ComplianceStatus.BLOCKED) {
    complianceMessage = stringGetter({
      key: STRING_KEYS.PERMANENTLY_BLOCKED_MESSAGE,
      params: { EMAIL: complianceSupportEmail },
    }) as string;
  } else if (geo && isBlockedGeo(geo)) {
    complianceMessage = stringGetter({
      key: STRING_KEYS.BLOCKED_MESSAGE,
      params: {
        LINK: (
          <Link to="/terms">
            <LinkOutIcon />
          </Link>
        ),
      },
    }) as string;
  }

  return {
    geo,
    complianceStatus,
    complianceState,
    complianceMessage,
  };
};
