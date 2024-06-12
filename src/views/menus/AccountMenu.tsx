import { ElementType, memo } from 'react';

import { useMfaEnrollment, usePrivy } from '@privy-io/react-auth';
import type { Dispatch } from '@reduxjs/toolkit';
import { shallowEqual } from 'react-redux';
import styled, { css } from 'styled-components';

import { OnboardingState } from '@/constants/account';
import { ButtonAction, ButtonShape, ButtonSize, ButtonType } from '@/constants/buttons';
import { ComplianceStates } from '@/constants/compliance';
import { DialogTypes } from '@/constants/dialogs';
import {
  STRING_KEYS,
  TOOLTIP_STRING_KEYS,
  type StringGetterFunction,
} from '@/constants/localization';
import { isDev } from '@/constants/networks';
import { DydxChainAsset, WalletType, wallets } from '@/constants/wallets';

import { useAccountBalance } from '@/hooks/useAccountBalance';
import { useAccounts } from '@/hooks/useAccounts';
import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useComplianceState } from '@/hooks/useComplianceState';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import { DiscordIcon, GoogleIcon, TwitterIcon } from '@/icons';
import { headerMixins } from '@/styles/headerMixins';
import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { CopyButton } from '@/components/CopyButton';
import { DropdownMenu } from '@/components/DropdownMenu';
import { Icon, IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Output, OutputType } from '@/components/Output';
import { WithTooltip } from '@/components/WithTooltip';
import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { getOnboardingState, getSubaccount } from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { AppTheme } from '@/state/configs';
import { getAppTheme } from '@/state/configsSelectors';
import { openDialog } from '@/state/dialogs';

import { isTruthy } from '@/lib/isTruthy';
import { MustBigNumber } from '@/lib/numbers';
import { truncateAddress } from '@/lib/wallet';

import { getMobileAppUrl } from '../dialogs/MobileDownloadDialog';

export const AccountMenu = () => {
  const stringGetter = useStringGetter();
  const { mintscanBase } = useURLConfigs();
  const { isTablet } = useBreakpoints();
  const { complianceState } = useComplianceState();

  const dispatch = useAppDispatch();
  const onboardingState = useAppSelector(getOnboardingState);
  const { freeCollateral } = useAppSelector(getSubaccount, shallowEqual) ?? {};

  const { nativeTokenBalance } = useAccountBalance();
  const { usdcLabel, chainTokenLabel } = useTokenConfigs();
  const theme = useAppSelector(getAppTheme);

  const { evmAddress, walletType, dydxAddress, hdKey } = useAccounts();

  const privy = usePrivy();
  const { google, discord, twitter } = privy?.user ?? {};

  const { showMfaEnrollmentModal } = useMfaEnrollment();

  const usdcBalance = freeCollateral?.current ?? 0;

  const onRecoverKeys = () => {
    dispatch(openDialog(DialogTypes.Onboarding()));
  };

  let walletIcon;
  if (onboardingState === OnboardingState.WalletConnected) {
    walletIcon = <$WarningIcon iconName={IconName.Warning} />;
  } else if (
    onboardingState === OnboardingState.AccountConnected &&
    walletType === WalletType.Privy
  ) {
    if (google) {
      walletIcon = <Icon iconComponent={GoogleIcon as ElementType} />;
    } else if (discord) {
      walletIcon = <Icon iconComponent={DiscordIcon as ElementType} />;
    } else if (twitter) {
      walletIcon = <Icon iconComponent={TwitterIcon as ElementType} />;
    } else {
      walletIcon = <Icon iconComponent={wallets[walletType].icon as ElementType} />;
    }
  } else if (walletType) {
    walletIcon = <Icon iconComponent={wallets[walletType].icon as ElementType} />;
  }

  return onboardingState === OnboardingState.Disconnected ? (
    <OnboardingTriggerButton size={ButtonSize.XSmall} />
  ) : (
    <$DropdownMenu
      slotTopContent={
        onboardingState === OnboardingState.AccountConnected && (
          <$AccountInfo>
            <$AddressRow>
              <$AssetIcon symbol="DYDX" />
              <$Column>
                <WithTooltip
                  slotTooltip={
                    <dl>
                      <dt>
                        {stringGetter({
                          key: TOOLTIP_STRING_KEYS.DYDX_ADDRESS_BODY,
                          params: {
                            DYDX_ADDRESS: <strong>{truncateAddress(dydxAddress)}</strong>,
                            EVM_ADDRESS: truncateAddress(evmAddress, '0x'),
                          },
                        })}
                      </dt>
                    </dl>
                  }
                >
                  <$label>{stringGetter({ key: STRING_KEYS.DYDX_CHAIN_ADDRESS })}</$label>
                </WithTooltip>
                <$Address>{truncateAddress(dydxAddress)}</$Address>
              </$Column>
              <$CopyButton buttonType="icon" value={dydxAddress} shape={ButtonShape.Square} />
              <WithTooltip tooltipString={stringGetter({ key: STRING_KEYS.MINTSCAN })}>
                <$IconButton
                  action={ButtonAction.Base}
                  href={`${mintscanBase}/account/${dydxAddress}`}
                  iconName={IconName.LinkOut}
                  shape={ButtonShape.Square}
                  type={ButtonType.Link}
                />
              </WithTooltip>
            </$AddressRow>
            {walletType && walletType !== WalletType.Privy && (
              <$AddressRow>
                <$SourceIcon>
                  <$ConnectorIcon iconName={IconName.AddressConnector} />
                  <Icon iconComponent={wallets[walletType].icon as ElementType} />
                </$SourceIcon>
                <$Column>
                  <$label>{stringGetter({ key: STRING_KEYS.SOURCE_ADDRESS })}</$label>
                  <$Address>{truncateAddress(evmAddress, '0x')}</$Address>
                </$Column>
              </$AddressRow>
            )}
            <$Balances>
              <div>
                <div>
                  <$label>
                    {stringGetter({
                      key: STRING_KEYS.ASSET_BALANCE,
                      params: { ASSET: chainTokenLabel },
                    })}
                    <AssetIcon symbol={chainTokenLabel} />
                  </$label>
                  <$BalanceOutput type={OutputType.Asset} value={nativeTokenBalance} />
                </div>
                <AssetActions
                  asset={DydxChainAsset.CHAINTOKEN}
                  complianceState={complianceState}
                  dispatch={dispatch}
                  hasBalance={nativeTokenBalance.gt(0)}
                  stringGetter={stringGetter}
                />
              </div>
              <div>
                <div>
                  <$label>
                    {stringGetter({
                      key: STRING_KEYS.ASSET_BALANCE,
                      params: { ASSET: usdcLabel },
                    })}
                    <AssetIcon symbol="USDC" />
                  </$label>
                  <$BalanceOutput type={OutputType.Asset} value={usdcBalance} fractionDigits={2} />
                </div>
                <AssetActions
                  asset={DydxChainAsset.USDC}
                  complianceState={complianceState}
                  dispatch={dispatch}
                  hasBalance={MustBigNumber(usdcBalance).gt(0)}
                  stringGetter={stringGetter}
                  withOnboarding
                />
              </div>
            </$Balances>
          </$AccountInfo>
        )
      }
      items={[
        onboardingState === OnboardingState.WalletConnected && {
          value: 'ConnectToChain',
          label: (
            <$ConnectToChain>
              <p>{stringGetter({ key: STRING_KEYS.MISSING_KEYS_DESCRIPTION })}</p>
              <OnboardingTriggerButton />
            </$ConnectToChain>
          ),
          onSelect: onRecoverKeys,
          separator: true,
        },
        {
          value: 'Preferences',
          icon: <Icon iconName={IconName.Gear} />,
          label: stringGetter({ key: STRING_KEYS.PREFERENCES }),
          onSelect: () => dispatch(openDialog(DialogTypes.Preferences())),
        },
        {
          value: 'DisplaySettings',
          icon:
            theme === AppTheme.Light ? (
              <Icon iconName={IconName.Sun} />
            ) : (
              <Icon iconName={IconName.Moon} />
            ),
          label: stringGetter({ key: STRING_KEYS.DISPLAY_SETTINGS }),
          onSelect: () => dispatch(openDialog(DialogTypes.DisplaySettings())),
        },
        ...(isDev
          ? [
              {
                value: 'ComplianceConfig',
                icon: <Icon iconName={IconName.Gear} />,
                label: 'Compliance Config',
                onSelect: () => {
                  dispatch(openDialog(DialogTypes.ComplianceConfig()));
                },
              },
            ]
          : []),
        ...(getMobileAppUrl()
          ? [
              {
                value: 'MobileDownload',
                icon: <Icon iconName={IconName.Qr} />,
                label: stringGetter({ key: STRING_KEYS.DOWNLOAD_MOBILE_APP }),
                onSelect: () => {
                  dispatch(openDialog(DialogTypes.MobileDownload()));
                },
              },
            ]
          : []),
        ...(onboardingState === OnboardingState.AccountConnected && hdKey
          ? [
              {
                value: 'MobileQrSignIn',
                icon: <Icon iconName={IconName.Qr} />,
                label: stringGetter({ key: STRING_KEYS.TITLE_SIGN_INTO_MOBILE }),
                onSelect: () => dispatch(openDialog(DialogTypes.MobileSignIn())),
              },
              {
                value: 'MnemonicExport',
                icon: <Icon iconName={IconName.ExportKeys} />,
                label: <span>{stringGetter({ key: STRING_KEYS.EXPORT_SECRET_PHRASE })}</span>,
                highlightColor: 'destroy' as const,
                onSelect: () => dispatch(openDialog(DialogTypes.MnemonicExport())),
              },
            ]
          : []),
        ...(privy.ready && privy.authenticated
          ? [
              {
                value: 'MFA',
                icon: <Icon iconName={IconName.Lock} />,
                label: stringGetter({ key: STRING_KEYS.MULTI_FACTOR_AUTH }),
                onSelect: () => showMfaEnrollmentModal(),
              },
            ]
          : []),
        {
          value: 'Disconnect',
          icon: <Icon iconName={IconName.BoxClose} />,
          label: stringGetter({ key: STRING_KEYS.DISCONNECT }),
          highlightColor: 'destroy' as const,
          onSelect: () => dispatch(openDialog(DialogTypes.DisconnectWallet())),
        },
      ].filter(isTruthy)}
      align="end"
      sideOffset={16}
    >
      {walletIcon}
      {!isTablet && <$Address>{truncateAddress(dydxAddress)}</$Address>}
    </$DropdownMenu>
  );
};

const AssetActions = memo(
  ({
    asset,
    dispatch,
    complianceState,
    withOnboarding,
    hasBalance,
    stringGetter,
  }: {
    asset: DydxChainAsset;
    dispatch: Dispatch;
    complianceState: ComplianceStates;
    withOnboarding?: boolean;
    hasBalance?: boolean;
    stringGetter: StringGetterFunction;
  }) => (
    <$InlineRow>
      {[
        withOnboarding &&
          complianceState === ComplianceStates.FULL_ACCESS && {
            dialog: DialogTypes.Deposit(),
            iconName: IconName.Deposit,
            tooltipStringKey: STRING_KEYS.DEPOSIT,
          },
        withOnboarding &&
          hasBalance && {
            dialog: DialogTypes.Withdraw(),
            iconName: IconName.Withdraw,
            tooltipStringKey: STRING_KEYS.WITHDRAW,
          },
        hasBalance &&
          complianceState === ComplianceStates.FULL_ACCESS && {
            dialog: DialogTypes.Transfer({ selectedAsset: asset }),
            iconName: IconName.Send,
            tooltipStringKey: STRING_KEYS.TRANSFER,
          },
      ]
        .filter(isTruthy)
        .map(({ iconName, tooltipStringKey, dialog }) => (
          <$WithTooltip
            key={tooltipStringKey}
            tooltipString={stringGetter({ key: tooltipStringKey })}
          >
            <$IconButton
              key={dialog.type}
              action={ButtonAction.Base}
              shape={ButtonShape.Square}
              iconName={iconName}
              onClick={() => dispatch(openDialog(dialog))}
            />
          </$WithTooltip>
        ))}
    </$InlineRow>
  )
);
const $AccountInfo = styled.div`
  ${layoutMixins.flexColumn}

  gap: 1rem;
  padding: 1rem 1rem 0.5rem 1rem;
`;

const $Column = styled.div`
  ${layoutMixins.column}
`;

const $InlineRow = styled.div`
  ${layoutMixins.inlineRow}
`;

const $AddressRow = styled.div`
  ${layoutMixins.row}

  gap: 0.5rem;

  ${$Column} {
    margin-right: 0.5rem;
  }
`;

const $AssetIcon = styled(AssetIcon)`
  z-index: 2;

  font-size: 1.75rem;
`;

const $SourceIcon = styled.div`
  padding: 0.375rem;
  position: relative;
  z-index: 1;

  font-size: 1rem;

  line-height: 0;
  border-radius: 50%;
  background-color: #303045;
`;

const $ConnectorIcon = styled(Icon)`
  position: absolute;
  top: -1.625rem;
  height: 1.75rem;
`;

const $label = styled.div`
  ${layoutMixins.row}

  gap: 0.25rem;
  font-size: var(--fontSize-mini);
  color: var(--color-text-0);

  img {
    font-size: 1rem;
  }
`;

const $Balances = styled.div`
  ${layoutMixins.flexColumn}

  > div {
    ${layoutMixins.spacedRow}
    box-shadow: 0 0 0 1px var(--color-border);

    gap: 0.5rem;
    padding: 0.625rem 1rem;

    background-color: var(--color-layer-4);

    &:first-child {
      border-radius: 0.5rem 0.5rem 0 0;
    }
    &:last-child {
      border-radius: 0 0 0.5rem 0.5rem;
    }
  }
`;

const $BalanceOutput = styled(Output)`
  font-size: var(--fontSize-medium);
`;

const $DropdownMenu = styled(DropdownMenu)`
  ${headerMixins.dropdownTrigger}

  --dropdownMenu-item-font-size: 0.875rem;
  --popover-padding: 0 0 0.5rem 0;
` as typeof DropdownMenu;

const $WarningIcon = styled(Icon)`
  font-size: 1.25rem;
  color: var(--color-warning);
`;

const $Address = styled.span`
  font: var(--font-base-book);
  font-feature-settings: var(--fontFeature-monoNumbers);
`;

const $ConnectToChain = styled($Column)`
  max-width: 12em;
  gap: 0.5rem;
  text-align: center;

  p {
    color: var(--color-text-1);
    font: var(--font-small-book);
  }
`;

const $IconButton = styled(IconButton)`
  --button-padding: 0 0.25rem;
  --button-border: solid var(--border-width) var(--color-layer-6);

  ${({ iconName }) =>
    iconName != null &&
    [IconName.Withdraw, IconName.Deposit].includes(iconName) &&
    css`
      --button-icon-size: 1.375em;
    `}
`;

const $CopyButton = styled(CopyButton)`
  --button-padding: 0 0.25rem;
  --button-border: solid var(--border-width) var(--color-layer-6);
`;

const $WithTooltip = styled(WithTooltip)`
  --tooltip-backgroundColor: var(--color-layer-5);
`;
