import { useState } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { OnboardingState } from '@/constants/account';
import { ButtonAction, ButtonShape, ButtonSize, ButtonStyle } from '@/constants/buttons';
import { MODERATE_DEBOUNCE_MS } from '@/constants/debounce';
import { DialogProps, DialogTypes, RestrictedGeoDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { AppRoute } from '@/constants/routes';

import useOnboardingFlow from '@/hooks/Onboarding/useOnboardingFlow';
import { useAccounts } from '@/hooks/useAccounts';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import { Dialog, DialogPlacement } from '@/components/Dialog';
import { Icon, IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { MixedColorFiatOutput } from '@/components/MixedColorFiatOutput';

import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

import { isTruthy } from '@/lib/isTruthy';
import { orEmptyObj } from '@/lib/typeUtils';
import { truncateAddress } from '@/lib/wallet';

import { OnboardingTriggerButton } from './OnboardingTriggerButton';

export const UserMenuDialog = ({
  preventClose,
  setIsOpen,
}: DialogProps<RestrictedGeoDialogProps>) => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const canAccountTrade = useAppSelector(calculateCanAccountTrade);
  const { equity } = orEmptyObj(useAppSelector(BonsaiCore.account.parentSubaccountSummary.data));

  const isLoading =
    useAppSelector(BonsaiCore.account.parentSubaccountSummary.loading) === 'pending';

  const { openOnboardingDialog, onboardingState, isOnboardingDisabled, isAccountViewOnly } =
    useOnboardingFlow();

  const {
    sourceAccount: { walletInfo, address },
    dydxAddress,
  } = useAccounts();

  const [walletDisplay, setWalletDisplay] = useState<'chain' | 'source'>('chain');

  const [copied, setCopied] = useState(false);

  const onCopy = () => {
    if (walletDisplay === 'chain') {
      if (!dydxAddress) return;
      setCopied(true);
      navigator.clipboard.writeText(dydxAddress);
      setTimeout(() => setCopied(false), MODERATE_DEBOUNCE_MS);
    } else {
      if (!address) return;
      setCopied(true);
      navigator.clipboard.writeText(address);
      setTimeout(() => setCopied(false), MODERATE_DEBOUNCE_MS);
    }
  };

  const onClose = () => {
    setIsOpen(false);
  };

  const menuItems = [
    onboardingState === OnboardingState.AccountConnected && {
      value: 'history',
      label: stringGetter({ key: STRING_KEYS.HISTORY }),
      icon: <Icon iconName={IconName.Clock} />,
      onClick: () => {
        navigate(AppRoute.Portfolio);
        onClose();
      },
    },
    onboardingState === OnboardingState.AccountConnected && {
      value: 'settings',
      label: stringGetter({ key: STRING_KEYS.SETTINGS }),
      icon: <Icon iconName={IconName.Settings} />,
      onClick: () => {
        navigate(AppRoute.Settings);
        onClose();
      },
    },
    {
      value: 'help',
      label: stringGetter({ key: STRING_KEYS.HELP }),
      icon: <Icon iconName={IconName.HelpCircle} />,
      onClick: () => {
        dispatch(openDialog(DialogTypes.Help()));
        onClose();
      },
    },
    onboardingState !== OnboardingState.Disconnected && {
      value: 'disconnect-wallet',
      label: stringGetter({ key: STRING_KEYS.SIGN_OUT }),
      highlightColor: 'destroy' as const,
      icon: <Icon iconName={IconName.XCircle} />,
      onClick: () => {
        dispatch(openDialog(DialogTypes.DisconnectWallet()));
        onClose();
      },
    },
  ].filter(isTruthy);

  const walletDisplayRow = canAccountTrade ? (
    <div tw="row justify-between">
      <Button
        shape={ButtonShape.Pill}
        action={ButtonAction.Base}
        size={ButtonSize.XSmall}
        tw="justify-start gap-0"
        onClick={onCopy}
      >
        <div tw="row gap-0.5 text-color-text-2">
          {walletDisplay === 'chain'
            ? truncateAddress(dydxAddress)
            : truncateAddress(address, '0x')}
          <Icon
            css={{
              color: copied ? 'var(--color-success)' : 'var(--color-text-0)',
            }}
            iconName={copied ? IconName.Check : IconName.Copy}
          />
        </div>
      </Button>
      <Button
        shape={ButtonShape.Pill}
        size={ButtonSize.XSmall}
        action={ButtonAction.Base}
        buttonStyle={ButtonStyle.WithoutBackground}
        tw="justify-start gap-0 text-color-text-1 font-mini-book"
        onClick={() => setWalletDisplay((prev) => (prev === 'chain' ? 'source' : 'chain'))}
      >
        <div tw="row gap-0.5">
          {walletDisplay === 'chain'
            ? stringGetter({ key: STRING_KEYS.DYDX_CHAIN_ADDRESS })
            : stringGetter({ key: STRING_KEYS.SOURCE_ADDRESS })}
          <Icon
            css={{
              '--icon-size': '0.5rem',
            }}
            iconName={IconName.Caret}
          />
        </div>
      </Button>
    </div>
  ) : (
    <OnboardingTriggerButton />
  );

  const userContent = (
    <$UserContent>
      <div tw="row justify-between">
        <div tw="row gap-0.5">
          <div tw="relative">
            <img
              tw="size-[3rem] rounded-1 bg-[#AA8CFF] object-contain"
              src="/hedgie-profile.png"
              alt="profile"
            />
          </div>

          <div tw="flexColumn">
            <MixedColorFiatOutput tw="font-large-book" value={equity} />
            <span tw="text-color-text-0 font-mini-book">
              {stringGetter({ key: STRING_KEYS.BALANCE })}
            </span>
          </div>
        </div>
        <IconButton
          tw="mb-auto border-none"
          buttonStyle={ButtonStyle.WithoutBackground}
          css={{
            '--button-icon-size': '1.5rem',
          }}
          iconName={IconName.ThreeDot}
        />
      </div>
      {walletDisplayRow}
    </$UserContent>
  );

  const isTransferDisabled = !canAccountTrade || isLoading;

  const transferContent = (
    <div tw="row gap-0.5">
      <Button tw="flex-1" state={{ isDisabled: isTransferDisabled }} action={ButtonAction.Primary}>
        {stringGetter({ key: STRING_KEYS.DEPOSIT })}
      </Button>
      <IconButton
        size={ButtonSize.Base}
        shape={ButtonShape.Square}
        iconName={IconName.Transfer}
        state={{ isDisabled: isTransferDisabled }}
      />
    </div>
  );

  const menuContent = (
    <$MenuContent>
      {menuItems.map((item) => (
        <Button
          key={item.value}
          onClick={item.onClick}
          css={{
            '--button-border': 'none',
            borderRadius: 0,
            justifyContent: 'space-between',
          }}
        >
          <div tw="row gap-0.5">
            {item.icon}
            {item.label}
          </div>
          <$Caret iconName={IconName.Caret} />
        </Button>
      ))}
    </$MenuContent>
  );

  return (
    <Dialog
      isOpen
      withClose
      preventClose={preventClose}
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.MENU })}
      placement={DialogPlacement.FullScreen}
      css={{
        '--simpleUi-dialog-backgroundColor': 'var(--color-layer-1)',
        '--simpleUi-dialog-secondaryColor': 'var(--color-layer-2)',
        '--dialog-backgroundColor': 'var(--simpleUi-dialog-backgroundColor)',
        '--dialog-header-backgroundColor': 'var(--simpleUi-dialog-backgroundColor)',
      }}
    >
      <div tw="flexColumn gap-1.5">
        {userContent}
        {transferContent}
        {menuContent}
      </div>
    </Dialog>
  );
};

const $UserContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  border-radius: 1rem;
  border: solid var(--default-border-width) var(--color-border);
  padding: 1rem;
`;

const $MenuContent = styled.div`
  display: flex;
  flex-direction: column;
  border-radius: 1rem;
  overflow: hidden;
  gap: 1px;
`;

const $Caret = styled(Icon)`
  --icon-size: 0.5rem;
  transform: rotate(0.75turn);
`;
