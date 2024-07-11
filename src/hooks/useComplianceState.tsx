import { shallowEqual } from 'react-redux';
import styled from 'styled-components';

import { ComplianceStatus } from '@/constants/abacus';
import { CLOSE_ONLY_GRACE_PERIOD, ComplianceStates } from '@/constants/compliance';
import { STRING_KEYS } from '@/constants/localization';

import { Link } from '@/components/Link';
import { OutputType, formatDateOutput } from '@/components/Output';
import { TermsOfUseLink } from '@/components/TermsOfUseLink';

import { getComplianceStatus, getComplianceUpdatedAt, getGeo } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';
import { getSelectedLocale } from '@/state/localizationSelectors';

import { isBlockedGeo } from '@/lib/compliance';

import { useEnvFeatures } from './useEnvFeatures';
import { useStringGetter } from './useStringGetter';
import { useURLConfigs } from './useURLConfigs';

export const useComplianceState = () => {
  const stringGetter = useStringGetter();
  const { help } = useURLConfigs();
  const complianceStatus = useAppSelector(getComplianceStatus, shallowEqual);
  const complianceUpdatedAt = useAppSelector(getComplianceUpdatedAt);
  const geo = useAppSelector(getGeo);
  const selectedLocale = useAppSelector(getSelectedLocale);
  const { checkForGeo } = useEnvFeatures();

  const updatedAtDate = complianceUpdatedAt ? new Date(complianceUpdatedAt) : undefined;
  updatedAtDate?.setDate(updatedAtDate.getDate() + CLOSE_ONLY_GRACE_PERIOD);

  let complianceState = ComplianceStates.FULL_ACCESS;

  let complianceMessage;

  if (
    complianceStatus === ComplianceStatus.FIRST_STRIKE_CLOSE_ONLY ||
    complianceStatus === ComplianceStatus.CLOSE_ONLY
  ) {
    complianceState = ComplianceStates.CLOSE_ONLY;
  } else if (
    complianceStatus === ComplianceStatus.BLOCKED ||
    (geo && isBlockedGeo(geo) && checkForGeo)
  ) {
    complianceState = ComplianceStates.READ_ONLY;
  }

  if (complianceStatus === ComplianceStatus.FIRST_STRIKE_CLOSE_ONLY) {
    complianceMessage = `${stringGetter({ key: STRING_KEYS.CLICK_TO_VIEW })} →`;
  } else if (complianceStatus === ComplianceStatus.CLOSE_ONLY) {
    complianceMessage = stringGetter({
      key: STRING_KEYS.CLOSE_ONLY_MESSAGE_WITH_HELP,
      params: {
        DATE: updatedAtDate
          ? formatDateOutput(updatedAtDate.valueOf(), OutputType.DateTime, {
              dateFormat: 'medium',
              selectedLocale,
            })
          : undefined,
        HELP_LINK: (
          <Link href={help} isInline>
            {stringGetter({ key: STRING_KEYS.HELP_CENTER })}
          </Link>
        ),
      },
    });
  } else if (complianceStatus === ComplianceStatus.BLOCKED) {
    complianceMessage = stringGetter({
      key: STRING_KEYS.PERMANENTLY_BLOCKED_MESSAGE_WITH_HELP,
      params: {
        HELP_LINK: (
          <Link href={help} isInline>
            {stringGetter({ key: STRING_KEYS.HELP_CENTER })}
          </Link>
        ),
      },
    });
  } else if (geo && isBlockedGeo(geo)) {
    complianceMessage = stringGetter({
      key: STRING_KEYS.BLOCKED_MESSAGE,
      params: {
        TERMS_OF_USE_LINK: <$TermsOfUseLink isInline />,
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

const $TermsOfUseLink = styled(TermsOfUseLink)`
  text-decoration: underline;
`;
