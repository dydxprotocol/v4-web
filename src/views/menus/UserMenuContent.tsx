import { useState } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { OnboardingState } from '@/constants/account';
import { ButtonAction, ButtonShape, ButtonSize, ButtonStyle } from '@/constants/buttons';
import { ComplianceStates } from '@/constants/compliance';
import { MODERATE_DEBOUNCE_MS } from '@/constants/debounce';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { AppRoute } from '@/constants/routes';

import { useAccounts } from '@/hooks/useAccounts';
import { useComplianceState } from '@/hooks/useComplianceState';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { MixedColorFiatOutput } from '@/components/MixedColorFiatOutput';
import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { getOnboardingState } from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

import { isTruthy } from '@/lib/isTruthy';
import { orEmptyObj } from '@/lib/typeUtils';
import { truncateAddress } from '@/lib/wallet';

export const UserMenuContent = () => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const onboardingState = useAppSelector(getOnboardingState);
  const { complianceState } = useComplianceState();
  const canAccountTrade = useAppSelector(calculateCanAccountTrade);
  const { equity, freeCollateral } = orEmptyObj(
    useAppSelector(BonsaiCore.account.parentSubaccountSummary.data)
  );

  const isLoading =
    useAppSelector(BonsaiCore.account.parentSubaccountSummary.loading) === 'pending';

  const {
    sourceAccount: { address },
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

  const menuItems = [
    onboardingState === OnboardingState.AccountConnected && {
      key: 'history',
      label: stringGetter({ key: STRING_KEYS.HISTORY }),
      icon: <Icon iconName={IconName.Clock} />,
      onClick: () => {
        navigate(AppRoute.Portfolio);
      },
    },
    onboardingState === OnboardingState.AccountConnected && {
      key: 'settings',
      label: stringGetter({ key: STRING_KEYS.SETTINGS }),
      icon: <Icon iconName={IconName.GearStroke} />,
      onClick: () => {
        navigate(AppRoute.Settings);
      },
    },
    {
      key: 'help',
      label: stringGetter({ key: STRING_KEYS.HELP }),
      icon: <Icon iconName={IconName.InfoStroke} />,
      onClick: () => {
        dispatch(openDialog(DialogTypes.Help()));
      },
    },
    onboardingState !== OnboardingState.Disconnected && {
      key: 'disconnect-wallet',
      label: stringGetter({ key: STRING_KEYS.SIGN_OUT }),
      highlightColor: 'var(--color-red)',
      icon: <Icon iconName={IconName.XCircle} />,
      withoutCaret: true,
      onClick: () => {
        dispatch(openDialog(DialogTypes.DisconnectWallet()));
      },
    },
  ].filter(isTruthy);

  const walletDisplayRow = canAccountTrade ? (
    <div tw="row justify-between">
      <Button
        shape={ButtonShape.Pill}
        action={ButtonAction.Secondary}
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
        disabled={address == null}
        buttonStyle={ButtonStyle.WithoutBackground}
        tw="justify-start gap-0 text-color-text-1 font-mini-book"
        onClick={() => setWalletDisplay((prev) => (prev === 'chain' ? 'source' : 'chain'))}
      >
        <div tw="row gap-0.5">
          {walletDisplay === 'chain'
            ? `dYdX ${stringGetter({ key: STRING_KEYS.ADDRESS })}`
            : stringGetter({ key: STRING_KEYS.SOURCE_ADDRESS })}
          {address != null && (
            <Icon
              css={{
                '--icon-size': '0.5rem',
              }}
              iconName={IconName.Caret}
            />
          )}
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
            <span tw="absolute bottom-0 right-[-0.25rem] flex size-[1.375rem] min-h-[1.375rem] min-w-[1.375rem] items-center justify-center rounded-[50%] border-2 border-solid border-color-layer-1 bg-color-layer-2">
              <img src="/logos/dydx-x.png" alt="dydx" tw="size-0.625" />
            </span>
          </div>

          <div tw="flexColumn">
            <MixedColorFiatOutput tw="font-large-book" value={equity} />
            <span tw="text-color-text-0 font-mini-book">
              {stringGetter({ key: STRING_KEYS.BALANCE })}
            </span>
          </div>
        </div>
      </div>
      {walletDisplayRow}
    </$UserContent>
  );

  const isTransferDisabled = !canAccountTrade || isLoading;
  const hasBalance = freeCollateral?.gt(0);
  const showWithdrawOnly = canAccountTrade && hasBalance;
  const showAllTransferOptions =
    canAccountTrade && complianceState === ComplianceStates.FULL_ACCESS;

  const transferContent = showAllTransferOptions ? (
    <div tw="row gap-0.5">
      <Button
        tw="flex-1"
        state={{ isDisabled: isTransferDisabled }}
        action={ButtonAction.Primary}
        size={ButtonSize.BasePlus}
        onClick={() => {
          dispatch(openDialog(DialogTypes.Deposit2()));
        }}
      >
        <Icon iconName={IconName.Deposit2} />
        {stringGetter({ key: STRING_KEYS.DEPOSIT })}
      </Button>
      <IconButton
        tw="text-color-accent"
        size={ButtonSize.BasePlus}
        shape={ButtonShape.Square}
        iconName={IconName.Move}
        onClick={() => {
          dispatch(openDialog(DialogTypes.Withdraw2()));
        }}
      />
      <IconButton
        size={ButtonSize.BasePlus}
        shape={ButtonShape.Square}
        iconName={IconName.TransferArrows}
        state={{ isDisabled: isTransferDisabled }}
        onClick={() => {
          dispatch(openDialog(DialogTypes.Transfer({})));
        }}
      />
    </div>
  ) : showWithdrawOnly ? (
    <div tw="row gap-0.5">
      <Button
        tw="flex-1"
        state={{ isDisabled: isTransferDisabled }}
        action={ButtonAction.Primary}
        onClick={() => {
          dispatch(openDialog(DialogTypes.Withdraw2()));
        }}
      >
        <Icon iconName={IconName.Move} />
        {stringGetter({ key: STRING_KEYS.WITHDRAW })}
      </Button>
    </div>
  ) : null;

  const menuContent = (
    <$MenuContent>
      {menuItems.map((item) => (
        <Button
          key={item.key}
          onClick={item.onClick}
          css={{
            '--button-border': 'none',
            '--button-height': '3rem',
            '--button-padding': '0 1rem',
            borderRadius: 0,
            justifyContent: 'space-between',
            color: item.highlightColor ?? 'var(--color-text-1)',
          }}
        >
          <div tw="row gap-0.5">
            {item.icon}
            {item.label}
          </div>
          {!item.withoutCaret && <$Caret iconName={IconName.Caret} />}
        </Button>
      ))}
    </$MenuContent>
  );

  return (
    <div tw="flexColumn gap-1.5">
      {userContent}
      {transferContent}
      {menuContent}
    </div>
  );
};

const $UserContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  border-radius: 1rem;
  border: solid 1.6px var(--color-layer-2);
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
