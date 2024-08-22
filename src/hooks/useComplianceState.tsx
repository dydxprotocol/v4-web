import { useMemo } from 'react';

import { shallowEqual } from 'react-redux';

import { ComplianceStatus } from '@/constants/abacus';
import { OnboardingState } from '@/constants/account';
import { CLOSE_ONLY_GRACE_PERIOD, ComplianceStates } from '@/constants/compliance';
import { STRING_KEYS } from '@/constants/localization';

import { Link } from '@/components/Link';
import { OutputType, formatDateOutput } from '@/components/Output';
import { TermsOfUseLink } from '@/components/TermsOfUseLink';

import {
  getComplianceStatus,
  getComplianceUpdatedAt,
  getGeo,
  getOnboardingState,
} from '@/state/accountSelectors';
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
  const onboardingState = useAppSelector(getOnboardingState);
  const { checkForGeo } = useEnvFeatures();

  const complianceState = useMemo(() => {
    if (
      complianceStatus === ComplianceStatus.FIRST_STRIKE_CLOSE_ONLY ||
      complianceStatus === ComplianceStatus.CLOSE_ONLY
    ) {
      return ComplianceStates.CLOSE_ONLY;
    }

    if (
      complianceStatus === ComplianceStatus.BLOCKED ||
      (geo && isBlockedGeo(geo) && checkForGeo)
    ) {
      return ComplianceStates.READ_ONLY;
    }

    return ComplianceStates.FULL_ACCESS;
  }, [checkForGeo, complianceStatus, geo]);

  const complianceMessage = useMemo(() => {
    let message;

    const updatedAtDate = complianceUpdatedAt ? new Date(complianceUpdatedAt) : undefined;
    updatedAtDate?.setDate(updatedAtDate.getDate() + CLOSE_ONLY_GRACE_PERIOD);

    if (complianceStatus === ComplianceStatus.FIRST_STRIKE_CLOSE_ONLY) {
      message = `${stringGetter({ key: STRING_KEYS.CLICK_TO_VIEW })} →`;
    } else if (complianceStatus === ComplianceStatus.CLOSE_ONLY) {
      message = stringGetter({
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
      message = stringGetter({
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
      message = stringGetter({
        key: STRING_KEYS.BLOCKED_MESSAGE,
        params: {
          TERMS_OF_USE_LINK: <TermsOfUseLink isInline tw="underline" />,
        },
      });
    }
    return message;
  }, [complianceStatus, complianceUpdatedAt, geo, help, selectedLocale, stringGetter]);

  const disableConnectButton =
    complianceState === ComplianceStates.READ_ONLY &&
    onboardingState === OnboardingState.Disconnected;

  return {
    geo,
    complianceStatus,
    complianceState,
    complianceMessage,
    disableConnectButton,
  };
};
