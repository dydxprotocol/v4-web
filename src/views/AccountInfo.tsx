import styled from 'styled-components';

import { OnboardingState } from '@/constants/account';
import { STRING_KEYS } from '@/constants/localization';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { calculateCanViewAccount } from '@/state/accountCalculators';
import { getOnboardingState } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';

import { AccountInfoSection } from './AccountInfo/AccountInfoSection';

type StyleProps = {
  className?: string;
};

export const AccountInfo: React.FC = ({ className }: StyleProps) => {
  const stringGetter = useStringGetter();
  const { isTablet } = useBreakpoints();

  const onboardingState = useAppSelector(getOnboardingState);
  const canViewAccountInfo = useAppSelector(calculateCanViewAccount);

  return (
    <$AccountInfoSectionContainer className={className}>
      {onboardingState === OnboardingState.AccountConnected || canViewAccountInfo || !isTablet ? (
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

const $AccountInfoSectionContainer = styled.div`
  ${layoutMixins.column}

  height: var(--account-info-section-height);
  min-height: var(--account-info-section-height);
`;
