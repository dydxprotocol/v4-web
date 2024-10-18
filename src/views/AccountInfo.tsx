import styled, { css } from 'styled-components';

import { OnboardingState } from '@/constants/account';
import { STRING_KEYS } from '@/constants/localization';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { calculateCanViewAccount } from '@/state/accountCalculators';
import { getOnboardingState } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';

import { testFlags } from '@/lib/testFlags';

import { AccountInfoSection } from './AccountInfo/AccountInfoSection';

type StyleProps = {
  className?: string;
};

export const AccountInfo: React.FC = ({ className }: StyleProps) => {
  const stringGetter = useStringGetter();
  const { isTablet } = useBreakpoints();

  const onboardingState = useAppSelector(getOnboardingState);
  const canViewAccountInfo = useAppSelector(calculateCanViewAccount);

  const { uiRefresh } = testFlags;

  return (
    <$AccountInfoSectionContainer
      className={className}
      showAccountInfo={canViewAccountInfo}
      $uiRefreshEnabled={uiRefresh}
    >
      {onboardingState === OnboardingState.AccountConnected ||
      canViewAccountInfo ||
      (uiRefresh && !isTablet) ? (
        <AccountInfoSection />
      ) : (
        <$DisconnectedAccountInfoContainer>
          <p>
            {stringGetter({
              key: {
                [OnboardingState.Disconnected]: STRING_KEYS.CONNECT_YOUR_WALLET_EXTENDED,
                [OnboardingState.WalletConnected]: STRING_KEYS.MISSING_KEYS_DESCRIPTION,
              }[onboardingState],
            })}
          </p>
          <OnboardingTriggerButton />
        </$DisconnectedAccountInfoContainer>
      )}
    </$AccountInfoSectionContainer>
  );
};
const $DisconnectedAccountInfoContainer = styled.div`
  margin: auto;

  ${layoutMixins.column}
  justify-items: center;
  text-align: center;
  gap: 0.5em;

  p {
    ${layoutMixins.textLineClamp}
    font: var(--font-small-book);
    max-width: 14.5rem;
  }
`;

const $AccountInfoSectionContainer = styled.div<{
  showAccountInfo?: boolean;
  $uiRefreshEnabled: boolean;
}>`
  ${layoutMixins.column}

  ${({ $uiRefreshEnabled }) =>
    $uiRefreshEnabled
      ? css`
          height: var(--account-info-section-height);
          min-height: var(--account-info-section-height);
        `
      : css`
          height: var(--account-info-section-height-deprecated);
          min-height: var(--account-info-section-height-deprecated);
        `}

  ${({ showAccountInfo, $uiRefreshEnabled }) =>
    !showAccountInfo &&
    !$uiRefreshEnabled &&
    css`
      padding: 1.125em 1.25em 0.875em;
    `}
`;
