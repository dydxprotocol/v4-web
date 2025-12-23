import { useMemo } from 'react';

import { ComplianceStatus } from '@/bonsai/types/summaryTypes';
import { useMatch } from 'react-router-dom';

import { OnboardingState } from '@/constants/account';
import { ComplianceStates } from '@/constants/compliance';
import { STRING_KEYS } from '@/constants/localization';
import { AppRoute } from '@/constants/routes';

import { Link } from '@/components/Link';
import { TermsOfUseLink } from '@/components/TermsOfUseLink';

import { getComplianceStatus, getGeo, getOnboardingState } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';

import { useEnableSpot } from './useEnableSpot';
import { useEnvFeatures } from './useEnvFeatures';
import { useStringGetter } from './useStringGetter';
import { useURLConfigs } from './useURLConfigs';

export const usePerpetualsComplianceState = () => {
  const stringGetter = useStringGetter();
  const { help } = useURLConfigs();
  const complianceStatus = useAppSelector(getComplianceStatus);
  const geo = useAppSelector(getGeo);
  const onboardingState = useAppSelector(getOnboardingState);
  const { checkForGeo } = useEnvFeatures();
  const isSpotPage = useMatch(`${AppRoute.Spot}/*`) != null;
  const isSpotEnabled = useEnableSpot();

  const complianceState = useMemo(() => {
    if (
      complianceStatus === ComplianceStatus.FIRST_STRIKE_CLOSE_ONLY ||
      complianceStatus === ComplianceStatus.CLOSE_ONLY
    ) {
      return ComplianceStates.CLOSE_ONLY;
    }

    if (complianceStatus === ComplianceStatus.BLOCKED || (geo.currentlyGeoBlocked && checkForGeo)) {
      return ComplianceStates.READ_ONLY;
    }

    return ComplianceStates.FULL_ACCESS;
  }, [checkForGeo, complianceStatus, geo]);

  const complianceMessage = useMemo(() => {
    let message;

    const firstStrikeStatuses = [
      ComplianceStatus.FIRST_STRIKE_CLOSE_ONLY,
      ComplianceStatus.CLOSE_ONLY,
    ];

    const isGeoBlocked = geo.currentlyGeoBlocked && checkForGeo;

    if (firstStrikeStatuses.includes(complianceStatus) || isGeoBlocked) {
      message = stringGetter({
        key: STRING_KEYS.PERPETUALS_UNAVAILABLE_MESSAGE,
        params: {
          TERMS_OF_USE_LINK: <TermsOfUseLink isInline tw="underline" />,
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
    }

    return message;
  }, [checkForGeo, complianceStatus, geo, help, stringGetter]);

  const disableConnectButton =
    complianceState === ComplianceStates.READ_ONLY &&
    onboardingState === OnboardingState.Disconnected &&
    !isSpotEnabled;

  return {
    complianceStatus,
    complianceState,
    complianceMessage,
    disableConnectButton,
    showRestrictionWarning: complianceState === ComplianceStates.READ_ONLY && !isSpotPage,
    showComplianceBanner:
      (complianceMessage != null || complianceState === ComplianceStates.READ_ONLY) && !isSpotPage,
  };
};
