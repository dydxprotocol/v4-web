import { shallowEqual } from 'react-redux';
import styled from 'styled-components';

import { ComplianceStatus } from '@/constants/abacus';
import { CLOSE_ONLY_GRACE_PERIOD, ComplianceStates } from '@/constants/compliance';
import { STRING_KEYS } from '@/constants/localization';
import { isMainnet } from '@/constants/networks';
import { AppRoute, BASE_ROUTE } from '@/constants/routes';

import { layoutMixins } from '@/styles/layoutMixins';

import { Link } from '@/components/Link';

import { OutputType, formatDateOutput } from '@/components/Output';

import { getComplianceStatus, getComplianceUpdatedAt, getGeo } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';
import { getSelectedLocale } from '@/state/localizationSelectors';

import { isBlockedGeo } from '@/lib/compliance';

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
          ? formatDateOutput(updatedAtDate.valueOf(), OutputType.DateTime, selectedLocale, {
              dateFormat: 'medium',
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
          <$Link href={`${BASE_ROUTE}${AppRoute.Terms}`} withIcon>
            {stringGetter({ key: STRING_KEYS.TERMS_OF_USE })}
          </$Link>
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

const $Link = styled(Link)`
  ${layoutMixins.inlineRow};

  --link-color: var(--color-text-1);
  text-decoration: underline;
`;
