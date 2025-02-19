import { useEffect, useState } from 'react';

import styled, { css } from 'styled-components';
import tw from 'twin.macro';

import { EvmDerivedAccountStatus, OnboardingSteps } from '@/constants/account';
import { DialogProps, OnboardingDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { StatsigFlags } from '@/constants/statsig';
import { ConnectorType, WalletInfo, WalletType } from '@/constants/wallets';

import { useAccounts } from '@/hooks/useAccounts';
import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStatsigGateValue } from '@/hooks/useStatsig';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import breakpoints from '@/styles/breakpoints';
import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';

import { Dialog, DialogPlacement } from '@/components/Dialog';
import { GreenCheckCircle } from '@/components/GreenCheckCircle';
import { Icon, IconName } from '@/components/Icon';
import { Link } from '@/components/Link';
import { Ring } from '@/components/Ring';
import { WalletIcon } from '@/components/WalletIcon';
import { WithTooltip } from '@/components/WithTooltip';

import { calculateOnboardingStep } from '@/state/accountCalculators';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';

import { testFlags } from '@/lib/testFlags';

import { LanguageSelector } from '../menus/LanguageSelector';
import { ChooseWallet } from './OnboardingDialog/ChooseWallet';
import { GenerateKeys } from './OnboardingDialog/GenerateKeys';

export const OnboardingDialog = ({ setIsOpen }: DialogProps<OnboardingDialogProps>) => {
  const dispatch = useAppDispatch();
  const [derivationStatus, setDerivationStatus] = useState(EvmDerivedAccountStatus.NotDerived);

  const stringGetter = useStringGetter();
  const { isMobile } = useBreakpoints();
  const { walletLearnMore } = useURLConfigs();
  const { selectWallet, sourceAccount } = useAccounts();
  const showNewDepositFlow =
    useStatsigGateValue(StatsigFlags.ffDepositRewrite) || testFlags.showNewDepositFlow;

  const currentOnboardingStep = useAppSelector(calculateOnboardingStep);

  useEffect(() => {
    if (!currentOnboardingStep) setIsOpen(false);
  }, [currentOnboardingStep, setIsOpen, dispatch, showNewDepositFlow]);

  const setIsOpenFromDialog = (open: boolean) => {
    setIsOpen(open);
  };

  const onChooseWallet = (wallet: WalletInfo) => {
    if (wallet.connectorType === ConnectorType.DownloadWallet) {
      window.open(wallet.downloadLink, '_blank');
      return;
    }
    if (wallet.name === WalletType.Privy || wallet.name === WalletType.Keplr) {
      setIsOpenFromDialog(false);
    }
    selectWallet(wallet);
  };

  return (
    <$Dialog
      isOpen={Boolean(currentOnboardingStep)}
      setIsOpen={setIsOpenFromDialog}
      {...(currentOnboardingStep &&
        {
          [OnboardingSteps.ChooseWallet]: {
            title: (
              <div tw="flex items-center gap-0.5">
                {stringGetter({ key: STRING_KEYS.CONNECT_YOUR_WALLET })}
                <$WithTooltip
                  tw="text-color-text-0"
                  tooltipString={stringGetter({
                    key: STRING_KEYS.WALLET_DEFINITION,
                    params: {
                      ABOUT_WALLETS_LINK: (
                        <Link href={walletLearnMore} withIcon isInline>
                          {stringGetter({ key: STRING_KEYS.ABOUT_WALLETS })}
                        </Link>
                      ),
                    },
                  })}
                >
                  <$QuestionIcon iconName={IconName.QuestionMark} />
                </$WithTooltip>
              </div>
            ),
            description: stringGetter({ key: STRING_KEYS.SELECT_WALLET_FROM_OPTIONS }),
            children: (
              <$Content>
                <ChooseWallet onChooseWallet={onChooseWallet} />
              </$Content>
            ),
            hasFooterBorder: true,
            slotFooter: (
              <$Footer>
                <div tw="flex flex-col gap-0.5 text-color-text-0 font-small-medium">
                  <h3 tw="text-color-text-2 font-medium-book">
                    {stringGetter({ key: STRING_KEYS.SELECT_LANGUAGE })}
                  </h3>
                  {stringGetter({ key: STRING_KEYS.CHOOSE_PREFERRED_LANGUAGE })}
                </div>
                <$LanguageSelector />
              </$Footer>
            ),
          },
          [OnboardingSteps.KeyDerivation]: {
            slotIcon: {
              [EvmDerivedAccountStatus.NotDerived]: sourceAccount.walletInfo && (
                <WalletIcon wallet={sourceAccount.walletInfo} />
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
        }[currentOnboardingStep])}
      placement={isMobile ? DialogPlacement.FullScreen : DialogPlacement.Default}
    />
  );
};
const $Content = tw.div`flexColumn gap-1`;

const $Dialog = styled(Dialog)<{ width?: string }>`
  @media ${breakpoints.notMobile} {
    ${({ width }) =>
      width &&
      css`
        --dialog-width: ${width};
      `}
  }

  --dialog-icon-size: 1.25rem;
  --dialog-content-paddingBottom: 1rem;
`;

const $Ring = tw(Ring)`w-1.25 h-1.25 [--ring-color:--color-accent]`;

const $WithTooltip = styled(WithTooltip)`
  a {
    text-decoration: none;
  }
`;

const $QuestionIcon = styled(Icon)`
  border: var(--border);
  border-radius: 50%;
  padding: 0.25rem;
  background-color: var(--color-layer-5);
  color: var(--color-text-1);
`;

const $Footer = styled.footer`
  ${layoutMixins.spacedRow}
  margin-top: auto;

  a {
    color: var(--color-text-0);
    font: var(--font-base-book);

    &:hover {
      color: var(--color-text-1);
    }
  }
`;

const $LanguageSelector = styled(LanguageSelector)`
  ${formMixins.inputInnerSelectMenu}
  --trigger-height: 2.75rem;
  --trigger-padding: 1rem 0.75rem;

  font: var(--font-base-book);
  width: 7rem;
`;
