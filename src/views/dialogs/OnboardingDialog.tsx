import { type ElementType, useState, useEffect } from 'react';
import styled, { AnyStyledComponent, css } from 'styled-components';

import { AnalyticsEvent } from '@/constants/analytics';
import { STRING_KEYS } from '@/constants/localization';
import { isMainnet } from '@/constants/networks';
import { EvmDerivedAccountStatus, OnboardingSteps } from '@/constants/account';
import { wallets } from '@/constants/wallets';

import { calculateOnboardingStep } from '@/state/accountCalculators';

import { useSelector } from 'react-redux';
import { useAccounts, useBreakpoints, useStringGetter } from '@/hooks';

import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';

import { Dialog, DialogPlacement } from '@/components/Dialog';
import { GreenCheckCircle } from '@/components/GreenCheckCircle';
import { Icon } from '@/components/Icon';
import { Ring } from '@/components/Ring';

import { TestnetDepositForm } from '@/views/forms/AccountManagementForms/TestnetDepositForm';

import { track } from '@/lib/analytics';

import { AcknowledgeTerms } from './OnboardingDialog/AcknowledgeTerms';
import { ChooseWallet } from './OnboardingDialog/ChooseWallet';
import { GenerateKeys } from './OnboardingDialog/GenerateKeys';
import { DepositForm } from '../forms/AccountManagementForms/DepositForm';

type ElementProps = {
  setIsOpen?: (open: boolean) => void;
};

export const OnboardingDialog = ({ setIsOpen }: ElementProps) => {
  const [derivationStatus, setDerivationStatus] = useState(EvmDerivedAccountStatus.NotDerived);

  const stringGetter = useStringGetter();
  const { isMobile } = useBreakpoints();

  const { disconnect, walletType } = useAccounts();

  const currentOnboardingStep = useSelector(calculateOnboardingStep);

  useEffect(() => {
    if (!currentOnboardingStep) setIsOpen?.(false);
  }, [currentOnboardingStep]);

  const setIsOpenFromDialog = (open: boolean) => {
    if (!open && currentOnboardingStep === OnboardingSteps.AcknowledgeTerms) {
      disconnect();
    }
    setIsOpen?.(open);
  };

  return (
    <Styled.Dialog
      isOpen={Boolean(currentOnboardingStep)}
      setIsOpen={setIsOpenFromDialog}
      {...(currentOnboardingStep &&
        {
          [OnboardingSteps.ChooseWallet]: {
            title: stringGetter({ key: STRING_KEYS.CONNECT_YOUR_WALLET }),
            description: 'Select your wallet from these supported options.',
            children: (
              <Styled.Content>
                <ChooseWallet />
              </Styled.Content>
            ),
          },
          [OnboardingSteps.KeyDerivation]: {
            slotIcon: {
              [EvmDerivedAccountStatus.NotDerived]: walletType && (
                <Icon iconComponent={wallets[walletType]?.icon as ElementType} />
              ),
              [EvmDerivedAccountStatus.Deriving]: <Styled.Ring withAnimation value={0.25} />,
              [EvmDerivedAccountStatus.EnsuringDeterminism]: (
                <Styled.Ring withAnimation value={0.25} />
              ),
              [EvmDerivedAccountStatus.Derived]: <GreenCheckCircle />,
            }[derivationStatus],
            title: stringGetter({ key: STRING_KEYS.SIGN_MESSAGE }),
            description: stringGetter({ key: STRING_KEYS.SIGNATURE_CREATES_COSMOS_WALLET }),
            children: (
              <Styled.Content>
                <GenerateKeys status={derivationStatus} setStatus={setDerivationStatus} />
              </Styled.Content>
            ),
            width: '23rem',
          },
          [OnboardingSteps.AcknowledgeTerms]: {
            title: stringGetter({ key: STRING_KEYS.ACKNOWLEDGE_TERMS }),
            children: (
              <Styled.Content>
                <AcknowledgeTerms onClose={() => setIsOpenFromDialog?.(false)} />
              </Styled.Content>
            ),
            width: '30rem',
          },
          [OnboardingSteps.DepositFunds]: {
            title: stringGetter({ key: STRING_KEYS.DEPOSIT }),
            description: !isMainnet && 'Test funds will be sent directly to your dYdX account.',
            children: (
              <Styled.Content>
                {isMainnet ? (
                  <DepositForm
                    onDeposit={() => {
                      track(AnalyticsEvent.TransferDeposit);
                    }}
                  />
                ) : (
                  <TestnetDepositForm
                    onDeposit={() => {
                      track(AnalyticsEvent.TransferFaucet);
                    }}
                  />
                )}
              </Styled.Content>
            ),
          },
        }[currentOnboardingStep])}
      placement={isMobile ? DialogPlacement.FullScreen : DialogPlacement.Default}
    />
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Content = styled.div`
  ${layoutMixins.flexColumn}
  gap: 1rem;
`;

Styled.Dialog = styled(Dialog)<{ width?: string }>`
  @media ${breakpoints.notMobile} {
    ${({ width }) =>
      width &&
      css`
        --dialog-width: ${width};
      `}
  }

  --dialog-icon-size: 1.25rem;
`;

Styled.Ring = styled(Ring)`
  width: 1.25rem;
  height: 1.25rem;
  --ring-color: var(--color-accent);
`;
