import { useEffect, useState, type ElementType } from 'react';

import styled, { css } from 'styled-components';

import { EvmDerivedAccountStatus, OnboardingSteps } from '@/constants/account';
import { AnalyticsEvent } from '@/constants/analytics';
import { STRING_KEYS } from '@/constants/localization';
import { isMainnet } from '@/constants/networks';
import { WalletType, wallets } from '@/constants/wallets';

import { useAccounts } from '@/hooks/useAccounts';
import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { Dialog, DialogPlacement } from '@/components/Dialog';
import { GreenCheckCircle } from '@/components/GreenCheckCircle';
import { Icon } from '@/components/Icon';
import { Ring } from '@/components/Ring';
import { TestnetDepositForm } from '@/views/forms/AccountManagementForms/TestnetDepositForm';

import { calculateOnboardingStep } from '@/state/accountCalculators';
import { useAppSelector } from '@/state/appTypes';

import { track } from '@/lib/analytics';

import { DepositForm } from '../forms/AccountManagementForms/DepositForm';
import { AcknowledgeTerms } from './OnboardingDialog/AcknowledgeTerms';
import { ChooseWallet } from './OnboardingDialog/ChooseWallet';
import { GenerateKeys } from './OnboardingDialog/GenerateKeys';

type ElementProps = {
  setIsOpen?: (open: boolean) => void;
};

export const OnboardingDialog = ({ setIsOpen }: ElementProps) => {
  const [derivationStatus, setDerivationStatus] = useState(EvmDerivedAccountStatus.NotDerived);

  const stringGetter = useStringGetter();
  const { isMobile } = useBreakpoints();

  const { selectWalletType, disconnect, walletType } = useAccounts();

  const currentOnboardingStep = useAppSelector(calculateOnboardingStep);

  useEffect(() => {
    if (!currentOnboardingStep) setIsOpen?.(false);
  }, [currentOnboardingStep]);

  const setIsOpenFromDialog = (open: boolean) => {
    if (!open && currentOnboardingStep === OnboardingSteps.AcknowledgeTerms) {
      disconnect();
    }
    setIsOpen?.(open);
  };

  const onChooseWallet = (wType: WalletType) => {
    if (wType === WalletType.Privy) {
      setIsOpenFromDialog(false);
    }
    selectWalletType(wType);
  };

  return (
    <$Dialog
      isOpen={Boolean(currentOnboardingStep)}
      setIsOpen={setIsOpenFromDialog}
      {...(currentOnboardingStep &&
        {
          [OnboardingSteps.ChooseWallet]: {
            title: stringGetter({ key: STRING_KEYS.CONNECT_YOUR_WALLET }),
            description: 'Select your wallet from these supported options.',
            children: (
              <$Content>
                <ChooseWallet onChooseWallet={onChooseWallet} />
              </$Content>
            ),
          },
          [OnboardingSteps.KeyDerivation]: {
            slotIcon: {
              [EvmDerivedAccountStatus.NotDerived]: walletType && (
                <Icon iconComponent={wallets[walletType]?.icon as ElementType} />
              ),
              [EvmDerivedAccountStatus.Deriving]: <$Ring withAnimation value={0.25} />,
              [EvmDerivedAccountStatus.EnsuringDeterminism]: <$Ring withAnimation value={0.25} />,
              [EvmDerivedAccountStatus.Derived]: <GreenCheckCircle />,
            }[derivationStatus],
            title: stringGetter({ key: STRING_KEYS.SIGN_MESSAGE }),
            description: stringGetter({ key: STRING_KEYS.SIGNATURE_CREATES_COSMOS_WALLET }),
            children: (
              <$Content>
                <GenerateKeys status={derivationStatus} setStatus={setDerivationStatus} />
              </$Content>
            ),
            width: '23rem',
          },
          [OnboardingSteps.AcknowledgeTerms]: {
            title: stringGetter({ key: STRING_KEYS.ACKNOWLEDGE_TERMS }),
            children: (
              <$Content>
                <AcknowledgeTerms onClose={() => setIsOpenFromDialog?.(false)} />
              </$Content>
            ),
            width: '30rem',
          },
          [OnboardingSteps.DepositFunds]: {
            title: stringGetter({ key: STRING_KEYS.DEPOSIT }),
            description: !isMainnet && 'Test funds will be sent directly to your dYdX account.',
            children: (
              <$Content>
                {isMainnet ? (
                  <DepositForm
                    onDeposit={(event) => {
                      track(AnalyticsEvent.TransferDeposit, event);
                    }}
                  />
                ) : (
                  <TestnetDepositForm
                    onDeposit={() => {
                      track(AnalyticsEvent.TransferFaucet);
                    }}
                  />
                )}
              </$Content>
            ),
          },
        }[currentOnboardingStep])}
      placement={isMobile ? DialogPlacement.FullScreen : DialogPlacement.Default}
    />
  );
};
const $Content = styled.div`
  ${layoutMixins.flexColumn}
  gap: 1rem;
`;

const $Dialog = styled(Dialog)<{ width?: string }>`
  @media ${breakpoints.notMobile} {
    ${({ width }) =>
      width &&
      css`
        --dialog-width: ${width};
      `}
  }

  --dialog-icon-size: 1.25rem;
`;

const $Ring = styled(Ring)`
  width: 1.25rem;
  height: 1.25rem;
  --ring-color: var(--color-accent);
`;
