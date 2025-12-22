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

import { isPresent } from '@/lib/typeUtils';

import { useEnvFeatures } from './useEnvFeatures';
import { useStringGetter } from './useStringGetter';
import { useURLConfigs } from './useURLConfigs';

export const useComplianceState = () => {
  const stringGetter = useStringGetter();
  const { help } = useURLConfigs();
  const complianceStatus = useAppSelector(getComplianceStatus);
  const geo = useAppSelector(getGeo);
  const onboardingState = useAppSelector(getOnboardingState);
  const { checkForGeo } = useEnvFeatures();
  const isSpotPage = useMatch(`${AppRoute.Spot}/*`) != null;

  const complianceState = useMemo(() => {
    if (complianceStatus === ComplianceStatus.BLOCKED) {
      return ComplianceStates.READ_ONLY;
    }

    if (geo.isPerpetualsGeoBlocked && checkForGeo) {
      return ComplianceStates.SPOT_ONLY;
    }

    return ComplianceStates.FULL_ACCESS;
  }, [checkForGeo, complianceStatus, geo.isPerpetualsGeoBlocked]);

  const complianceMessage = useMemo(() => {
    if (complianceState === ComplianceStates.READ_ONLY) {
      return stringGetter({
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

    if (isSpotPage) {
      return null;
    }

    if (complianceState === ComplianceStates.SPOT_ONLY) {
      return stringGetter({
        key: STRING_KEYS.PERPETUALS_UNAVAILABLE_MESSAGE,
        params: {
          TERMS_OF_USE_LINK: <TermsOfUseLink isInline tw="underline" />,
        },
      });
    }

    return null;
  }, [complianceState, help, isSpotPage, stringGetter]);

  const disableConnectButton =
    complianceState === ComplianceStates.READ_ONLY &&
    onboardingState === OnboardingState.Disconnected;

  return {
    complianceStatus,
    complianceState,
    complianceMessage,
    disableConnectButton,
    showComplianceBanner: isPresent(complianceMessage),
  };
};
