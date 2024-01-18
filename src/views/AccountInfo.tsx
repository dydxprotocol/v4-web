import styled, { AnyStyledComponent, css } from 'styled-components';
import { useSelector } from 'react-redux';

import { OnboardingState } from '@/constants/account';
import { STRING_KEYS } from '@/constants/localization';
import { useStringGetter } from '@/hooks';
import { layoutMixins } from '@/styles/layoutMixins';

import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { calculateCanViewAccount } from '@/state/accountCalculators';
import { getOnboardingState } from '@/state/accountSelectors';

import { AccountInfoConnectedState } from './AccountInfo/AccountInfoConnectedState';

type StyleProps = {
  className?: string;
};

export const AccountInfo: React.FC = ({ className }: StyleProps) => {
  const stringGetter = useStringGetter();
  const onboardingState = useSelector(getOnboardingState);
  const canViewAccountInfo = useSelector(calculateCanViewAccount);

  return (
    <Styled.AccountInfoSectionContainer className={className} showAccountInfo={canViewAccountInfo}>
      {onboardingState === OnboardingState.AccountConnected || canViewAccountInfo ? (
        <AccountInfoConnectedState />
      ) : (
        <Styled.DisconnectedAccountInfoContainer>
          <p>
            {stringGetter({
              key: {
                [OnboardingState.Disconnected]: STRING_KEYS.CONNECT_YOUR_WALLET_EXTENDED,
                [OnboardingState.WalletConnected]: STRING_KEYS.MISSING_KEYS_DESCRIPTION,
              }[onboardingState],
            })}
          </p>
          <OnboardingTriggerButton />
        </Styled.DisconnectedAccountInfoContainer>
      )}
    </Styled.AccountInfoSectionContainer>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.DisconnectedAccountInfoContainer = styled.div`
  margin: auto;

  ${layoutMixins.column}
  justify-items: center;
  text-align: center;
  gap: 1em;

  p {
    font: var(--font-small-book);
    max-width: 14.5rem;
  }
`;

Styled.AccountInfoSectionContainer = styled.div<{ showAccountInfo?: boolean }>`
  ${layoutMixins.column}
  height: var(--account-info-section-height);
  min-height: var(--account-info-section-height);

  ${({ showAccountInfo }) =>
    !showAccountInfo &&
    css`
      padding: 1.125em 1.25em 0.875em;
    `}
`;
