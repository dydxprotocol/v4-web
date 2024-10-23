import { ElementType, memo } from 'react';

import { useMfaEnrollment, usePrivy } from '@privy-io/react-auth';
import { Item } from '@radix-ui/react-dropdown-menu';
import type { Dispatch } from '@reduxjs/toolkit';
import { shallowEqual } from 'react-redux';
import styled, { css } from 'styled-components';
import tw from 'twin.macro';

import { AMOUNT_RESERVED_FOR_GAS_USDC, OnboardingState } from '@/constants/account';
import { ButtonAction, ButtonShape, ButtonSize, ButtonType } from '@/constants/buttons';
import { ComplianceStates } from '@/constants/compliance';
import { DialogTypes } from '@/constants/dialogs';
import {
  STRING_KEYS,
  TOOLTIP_STRING_KEYS,
  type StringGetterFunction,
} from '@/constants/localization';
import { isDev } from '@/constants/networks';
import { SMALL_USD_DECIMALS, USD_DECIMALS } from '@/constants/numbers';
import { StatsigFlags } from '@/constants/statsig';
import { DydxChainAsset, WalletNetworkType, wallets, WalletType } from '@/constants/wallets';

import { useAccountBalance } from '@/hooks/useAccountBalance';
import { useAccounts } from '@/hooks/useAccounts';
import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useComplianceState } from '@/hooks/useComplianceState';
import { useMobileAppUrl } from '@/hooks/useMobileAppUrl';
import { useStatsigGateValue } from '@/hooks/useStatsig';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';
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
import { Tag, TagSign } from '@/components/Tag';
import { WalletIcon } from '@/components/WalletIcon';
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

import { MobileDownloadLinks } from '../MobileDownloadLinks';

export const AccountMenu = () => {
  const stringGetter = useStringGetter();
  const { mintscanBase } = useURLConfigs();
  const { isTablet } = useBreakpoints();
  const { complianceState } = useComplianceState();
  const affiliatesEnabled = useStatsigGateValue(StatsigFlags.ffEnableAffiliates);

  const dispatch = useAppDispatch();
  const onboardingState = useAppSelector(getOnboardingState);
  const { freeCollateral } = useAppSelector(getSubaccount, shallowEqual) ?? {};

  const { nativeTokenBalance, usdcBalance } = useAccountBalance();

  const { usdcImage, usdcLabel, chainTokenImage, chainTokenLabel } = useTokenConfigs();
  const theme = useAppSelector(getAppTheme);

  const {
    sourceAccount: { walletInfo, address },
    dydxAddress,
    hdKey,
  } = useAccounts();
  const { registerAffiliate } = useSubaccount();

  let displayAddress: string | undefined;
  if (walletInfo?.name === WalletType.Phantom) {
    displayAddress = truncateAddress(address, '');
  } else {
    displayAddress = truncateAddress(address, '0x');
  }

  const privy = usePrivy();
  const { google, discord, twitter } = privy.user ?? {};

  const { showMfaEnrollmentModal } = useMfaEnrollment();

  const onRecoverKeys = () => {
    dispatch(openDialog(DialogTypes.Onboarding()));
  };

  const { appleAppStoreUrl, googlePlayStoreUrl } = useMobileAppUrl();

  const usedBalanceBN = MustBigNumber(usdcBalance);

  const showConfirmPendingDeposit =
    walletInfo?.name === WalletType.Keplr &&
    usedBalanceBN.gt(AMOUNT_RESERVED_FOR_GAS_USDC) &&
    usedBalanceBN.minus(AMOUNT_RESERVED_FOR_GAS_USDC).toFixed(2) !== '0.00';

  let walletIcon;
  if (onboardingState === OnboardingState.WalletConnected) {
    walletIcon = <Icon iconName={IconName.Warning} tw="text-[1.25rem] text-color-warning" />;
  } else if (
    onboardingState === OnboardingState.AccountConnected &&
    walletInfo?.name === WalletType.Privy
  ) {
    if (google) {
      walletIcon = <Icon iconComponent={GoogleIcon as ElementType} />;
    } else if (discord) {
      walletIcon = <Icon iconComponent={DiscordIcon as ElementType} />;
    } else if (twitter) {
      walletIcon = <Icon iconComponent={TwitterIcon as ElementType} />;
    } else {
      walletIcon = <Icon iconComponent={wallets[WalletType.Privy].icon as ElementType} />;
    }
  } else if (walletInfo) {
    walletIcon = <WalletIcon wallet={walletInfo} />;
  }

  return onboardingState === OnboardingState.Disconnected ? (
    <OnboardingTriggerButton size={ButtonSize.XSmall} />
  ) : (
    <$DropdownMenu
      slotTopContent={
        onboardingState === OnboardingState.AccountConnected && (
          <div tw="flexColumn gap-1 px-1 pb-0.5 pt-1">
            <$AddressRow>
              <AssetIcon
                logoUrl={chainTokenImage}
                symbol={chainTokenLabel}
                tw="z-[2] text-[1.75rem]"
              />
              <$Column>
                {walletInfo && walletInfo.name !== WalletType.Keplr ? (
                  <DydxDerivedAddress address={address} />
                ) : (
                  <$label>{stringGetter({ key: STRING_KEYS.DYDX_CHAIN_ADDRESS })}</$label>
                )}
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
            {walletInfo &&
              walletInfo.name !== WalletType.Privy &&
              walletInfo.name !== WalletType.Keplr && (
                <$AddressRow>
                  <div tw="relative z-[1] rounded-[50%] bg-[#303045] p-0.375 text-[1rem] leading-[0]">
                    <Icon
                      iconName={IconName.AddressConnector}
                      tw="absolute top-[-1.625rem] h-1.75"
                    />
                    <WalletIcon wallet={walletInfo} />
                  </div>
                  <$Column>
                    <$label>{stringGetter({ key: STRING_KEYS.SOURCE_ADDRESS })}</$label>
                    <$Address>{displayAddress}</$Address>
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
                    <AssetIcon logoUrl={chainTokenImage} symbol={chainTokenLabel} />
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
              {isDev && (
                <div>
                  <div>
                    <$label>
                      {stringGetter({
                        key: STRING_KEYS.WALLET_BALANCE,
                        params: { ASSET: usdcLabel },
                      })}
                      <AssetIcon logoUrl={usdcImage} symbol="USDC" />
                    </$label>
                    <$BalanceOutput
                      type={OutputType.Asset}
                      value={usdcBalance}
                      fractionDigits={SMALL_USD_DECIMALS}
                    />
                  </div>
                </div>
              )}
              <div>
                <div>
                  <$label>
                    {stringGetter({
                      key: STRING_KEYS.ASSET_BALANCE,
                      params: { ASSET: usdcLabel },
                    })}
                    <AssetIcon logoUrl={usdcImage} symbol="USDC" />
                  </$label>
                  <$BalanceOutput
                    type={OutputType.Asset}
                    value={freeCollateral?.current ?? 0}
                    fractionDigits={USD_DECIMALS}
                  />
                </div>
                <AssetActions
                  asset={DydxChainAsset.USDC}
                  complianceState={complianceState}
                  dispatch={dispatch}
                  hasBalance={MustBigNumber(freeCollateral?.current).gt(0)}
                  stringGetter={stringGetter}
                  withOnboarding
                />
              </div>
            </$Balances>
            {showConfirmPendingDeposit && (
              <$ConfirmPendingDeposit>
                You have a pending deposit
                <br /> for confirmation
                <$IconButton
                  action={ButtonAction.Base}
                  shape={ButtonShape.Square}
                  iconName={IconName.Send}
                  onClick={() =>
                    dispatch(
                      openDialog(
                        DialogTypes.ConfirmPendingDeposit({
                          usdcBalance:
                            MustBigNumber(usdcBalance).toNumber() - AMOUNT_RESERVED_FOR_GAS_USDC,
                        })
                      )
                    )
                  }
                />
              </$ConfirmPendingDeposit>
            )}
          </div>
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
        affiliatesEnabled &&
          onboardingState === OnboardingState.AccountConnected && {
            value: 'Affiliates',
            icon: <Icon iconName={IconName.Giftbox} />,
            label: (
              <span>
                {stringGetter({ key: STRING_KEYS.INVITE_FRIENDS })}{' '}
                <Tag sign={TagSign.Positive}>{stringGetter({ key: STRING_KEYS.EARN_FEES })}</Tag>
              </span>
            ),
            onSelect: () => {
              dispatch(openDialog(DialogTypes.ShareAffiliate()));
            },
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
                value: 'registerAffiliate',
                icon: <Icon iconName={IconName.Gear} />,
                label: 'Register Affiliate',
                onSelect: () => {
                  const affiliate = window.prompt('Enter affiliate address');
                  if (affiliate) {
                    registerAffiliate(affiliate);
                  }
                },
              },
            ]
          : []),
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
        ...(appleAppStoreUrl ?? googlePlayStoreUrl
          ? [
              {
                value: 'MobileDownload',
                icon: <Icon iconName={IconName.Qr} />,
                label: stringGetter({ key: STRING_KEYS.DOWNLOAD_MOBILE_APP }),
                onSelect: () => {
                  dispatch(
                    openDialog(
                      DialogTypes.MobileDownload({
                        mobileAppUrl: (appleAppStoreUrl ?? googlePlayStoreUrl)!,
                      })
                    )
                  );
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
      slotBottomContent={<MobileDownloadLinks withBadges />}
      align="end"
      sideOffset={16}
    >
      {walletIcon}
      {!isTablet && <$Address>{truncateAddress(dydxAddress)}</$Address>}
    </$DropdownMenu>
  );
};

const DydxDerivedAddress = ({
  address,
  chain,
  dydxAddress,
}: {
  address?: string;
  chain?: WalletNetworkType.Solana | WalletNetworkType.Evm;
  dydxAddress?: string;
}) => {
  const stringGetter = useStringGetter();

  const tooltipText =
    chain === WalletNetworkType.Solana
      ? stringGetter({
          key: TOOLTIP_STRING_KEYS.DYDX_ADDRESS_FROM_SOLANA_BODY,
          params: {
            DYDX_ADDRESS: <strong>{truncateAddress(dydxAddress)}</strong>,
            SOLANA_ADDRESS: truncateAddress(address, ''),
          },
        })
      : stringGetter({
          key: TOOLTIP_STRING_KEYS.DYDX_ADDRESS_FROM_ETHEREUM_BODY,
          params: {
            DYDX_ADDRESS: <strong>{truncateAddress(dydxAddress)}</strong>,
            EVM_ADDRESS: truncateAddress(address, '0x'),
          },
        });

  return (
    <WithTooltip
      slotTooltip={
        <dl>
          <dt>{tooltipText}</dt>
        </dl>
      }
    >
      <$label>{stringGetter({ key: STRING_KEYS.DYDX_CHAIN_ADDRESS })}</$label>
    </WithTooltip>
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
    <div tw="inlineRow">
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
          <Item key={tooltipStringKey}>
            {/* Need to wrap in Item to enable 'dismiss dropdown on click' functionality
          In general, any CTA in a dropdown should be wrapped in an Item tag
       */}
            <WithTooltip
              key={tooltipStringKey}
              tooltipString={stringGetter({ key: tooltipStringKey })}
              tw="[--tooltip-backgroundColor:--color-layer-5]"
            >
              <$IconButton
                key={dialog.type}
                action={ButtonAction.Base}
                shape={ButtonShape.Square}
                iconName={iconName}
                onClick={() => dispatch(openDialog(dialog))}
              />
            </WithTooltip>
          </Item>
        ))}
    </div>
  )
);
const $Column = styled.div`
  ${layoutMixins.column}
`;
const $AddressRow = styled.div`
  ${layoutMixins.row}

  gap: 0.5rem;

  ${$Column} {
    margin-right: 0.5rem;
  }
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

const $ConfirmPendingDeposit = styled.div`
  ${layoutMixins.row}

  justify-content: space-between;
  box-shadow: 0 0 0 1px var(--color-border);
  border-radius: 0.5rem;
  padding: 0.625rem 1rem;

  color: var(--color-text-1);
  font-size: var(--fontSize-small);
`;

const $BalanceOutput = tw(Output)`text-medium`;

const $DropdownMenu = styled(DropdownMenu)`
  ${headerMixins.dropdownTrigger}

  --dropdownMenu-item-font-size: 0.875rem;
  --popover-padding: 0 0 0.5rem 0;
  max-width: 17em;
` as typeof DropdownMenu;
const $Address = tw.span`font-base-book [font-feature-settings:--fontFeature-monoNumbers]`;

const $ConnectToChain = styled($Column)`
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
