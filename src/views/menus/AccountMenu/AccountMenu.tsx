import { ElementType, useMemo } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { useMfaEnrollment, usePrivy } from '@privy-io/react-auth';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import styled, { css } from 'styled-components';
import tw from 'twin.macro';

import { AMOUNT_RESERVED_FOR_GAS_USDC, OnboardingState } from '@/constants/account';
import { ButtonAction, ButtonShape, ButtonSize } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { isDev } from '@/constants/networks';
import { SMALL_USD_DECIMALS, USD_DECIMALS } from '@/constants/numbers';
import { StatsigFlags } from '@/constants/statsig';
import { ConnectorType, DydxChainAsset, wallets, WalletType } from '@/constants/wallets';

import { useAccountBalance } from '@/hooks/useAccountBalance';
import { useAccounts } from '@/hooks/useAccounts';
import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useComplianceState } from '@/hooks/useComplianceState';
import { useEnableSpot } from '@/hooks/useEnableSpot';
import { useEnvFeatures } from '@/hooks/useEnvFeatures';
import { useMobileAppUrl } from '@/hooks/useMobileAppUrl';
import { useStatsigGateValue } from '@/hooks/useStatsig';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { AppleIcon, AppleLightIcon, DiscordIcon, GoogleIcon, TwitterIcon } from '@/icons';
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
import { MobileDownloadLinks } from '@/views/MobileDownloadLinks';
import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { getOnboardingState, getSubaccountFreeCollateral } from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { AppTheme } from '@/state/appUiConfigs';
import { getAppTheme } from '@/state/appUiConfigsSelectors';
import { openDialog } from '@/state/dialogs';
import { selectIsKeplrConnected, selectIsTurnkeyConnected } from '@/state/walletSelectors';

import { isTruthy } from '@/lib/isTruthy';
import { MustBigNumber } from '@/lib/numbers';
import { truncateAddress } from '@/lib/wallet';

import { SpotActions } from './SpotActions';
import { SubaccountActions } from './SubaccountActions';
import { WalletActions } from './WalletActions';

// TODO: spot localization

export const AccountMenu = () => {
  const stringGetter = useStringGetter();
  const { isTablet } = useBreakpoints();
  const { complianceState } = useComplianceState();
  const affiliatesEnabled = useStatsigGateValue(StatsigFlags.ffEnableAffiliates);
  const spotEnabled = useEnableSpot();
  const dispatch = useAppDispatch();
  const onboardingState = useAppSelector(getOnboardingState);
  const freeCollateral = useAppSelector(getSubaccountFreeCollateral);
  const isKeplr = useAppSelector(selectIsKeplrConnected);
  const isTurnkey = useAppSelector(selectIsTurnkeyConnected);
  const spotWalletData = useAppSelector(BonsaiCore.spot.walletPositions.data);

  const { nativeTokenBalance, usdcBalance } = useAccountBalance();

  const { usdcImage, usdcLabel, chainTokenImage, chainTokenLabel } = useTokenConfigs();
  const theme = useAppSelector(getAppTheme);

  const { debugCompliance } = useEnvFeatures();
  const {
    sourceAccount: { walletInfo },
    dydxAddress,
    hdKey,
    solanaAddress,
    canDeriveSolanaWallet,
  } = useAccounts();
  const { registerAffiliate } = useSubaccount();

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

  const walletIcon = useMemo(() => {
    if (onboardingState === OnboardingState.WalletConnected) {
      return <Icon iconName={IconName.Warning} tw="text-[1.25rem] text-color-warning" />;
    }

    if (walletInfo == null) {
      return null;
    }

    if (
      onboardingState === OnboardingState.AccountConnected &&
      walletInfo.name === WalletType.Privy
    ) {
      if (google) {
        return <Icon iconComponent={GoogleIcon as ElementType} />;
      }

      if (discord) {
        return <Icon iconComponent={DiscordIcon as ElementType} />;
      }

      if (twitter) {
        return <Icon iconComponent={TwitterIcon as ElementType} />;
      }

      return (
        <Icon
          tw="rounded-[0.25rem]"
          iconComponent={wallets[WalletType.Privy].icon as ElementType}
        />
      );
    }

    if (
      onboardingState === OnboardingState.AccountConnected &&
      walletInfo.connectorType === ConnectorType.Turnkey
    ) {
      if (walletInfo.providerName === 'google') {
        return <Icon iconComponent={GoogleIcon as ElementType} />;
      }

      if (walletInfo.providerName === 'apple') {
        return (
          <Icon
            iconComponent={
              theme === AppTheme.Light
                ? (AppleIcon as ElementType)
                : (AppleLightIcon as ElementType)
            }
          />
        );
      }

      return <Icon iconComponent={wallets[WalletType.Turnkey].icon as ElementType} />;
    }

    return <WalletIcon wallet={walletInfo} />;
  }, [onboardingState, walletInfo, google, discord, twitter, theme]);

  return onboardingState === OnboardingState.Disconnected ? (
    <OnboardingTriggerButton size={ButtonSize.XSmall} />
  ) : (
    <$DropdownMenu
      modal={false}
      slotTopContent={
        onboardingState === OnboardingState.AccountConnected && (
          <div tw="flexColumn gap-1 px-1 pb-0.5 pt-1">
            <div tw="row flex-wrap gap-[0.25rem]">
              {!!walletInfo && canDeriveSolanaWallet && spotEnabled && solanaAddress && (
                <$AddressCopyButton
                  value={solanaAddress}
                  size={ButtonSize.XSmall}
                  shape={ButtonShape.Pill}
                  copyIconPosition="end"
                  action={ButtonAction.Base}
                >
                  <Icon iconName={IconName.Sol} size="1.25rem" />
                  {stringGetter({ key: STRING_KEYS.SPOT })}
                </$AddressCopyButton>
              )}
              <$AddressCopyButton
                value={dydxAddress}
                size={ButtonSize.XSmall}
                shape={ButtonShape.Pill}
                copyIconPosition="end"
                action={ButtonAction.Base}
              >
                <AssetIcon
                  logoUrl={chainTokenImage}
                  symbol={chainTokenLabel}
                  tw="[--asset-icon-size:1.25rem]"
                />
                {stringGetter({ key: STRING_KEYS.PERPETUALS })}
              </$AddressCopyButton>
            </div>

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
                <SubaccountActions
                  asset={DydxChainAsset.CHAINTOKEN}
                  complianceState={complianceState}
                  dispatch={dispatch}
                  hasBalance={nativeTokenBalance.gt(0)}
                  stringGetter={stringGetter}
                />
              </div>
              {(isDev || isKeplr) && (
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
                  <WalletActions
                    complianceState={complianceState}
                    dispatch={dispatch}
                    stringGetter={stringGetter}
                  />
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
                    value={freeCollateral ?? 0}
                    fractionDigits={USD_DECIMALS}
                  />
                </div>
                <SubaccountActions
                  asset={DydxChainAsset.USDC}
                  complianceState={complianceState}
                  dispatch={dispatch}
                  hasBalance={MustBigNumber(freeCollateral).gt(0)}
                  stringGetter={stringGetter}
                  withOnboarding
                />
              </div>
              {canDeriveSolanaWallet && spotEnabled && (
                <div>
                  <div>
                    <$label>
                      Spot Sol Balance
                      <Icon iconName={IconName.Sol} size="1rem" />
                    </$label>
                    <$BalanceOutput
                      type={OutputType.Asset}
                      value={
                        spotWalletData?.solBalance
                          ? spotWalletData.solBalance / LAMPORTS_PER_SOL
                          : 0
                      }
                    />
                  </div>
                  <SpotActions />
                </div>
              )}
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
        onboardingState === OnboardingState.AccountConnected &&
          isTurnkey && {
            value: 'ManageAccount',
            icon: <Icon iconName={IconName.User} />,
            label: stringGetter({ key: STRING_KEYS.ACCOUNT_MANAGEMENT }),
            onSelect: () => dispatch(openDialog(DialogTypes.ManageAccount())),
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
                  // eslint-disable-next-line no-alert
                  const affiliate = window.prompt('Enter affiliate address');
                  if (affiliate) {
                    registerAffiliate(affiliate);
                  }
                },
              },
            ]
          : []),
        ...(isDev || debugCompliance
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
        ...((appleAppStoreUrl ?? googlePlayStoreUrl)
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
        onboardingState === OnboardingState.AccountConnected &&
          hdKey && {
            value: 'MobileQrSignIn',
            icon: <Icon iconName={IconName.Qr} />,
            label: stringGetter({ key: STRING_KEYS.TITLE_SIGN_INTO_MOBILE }),
            onSelect: () => dispatch(openDialog(DialogTypes.MobileSignIn({}))),
          },
        onboardingState === OnboardingState.AccountConnected &&
          hdKey &&
          !isTurnkey && {
            value: 'MnemonicExport',
            icon: <Icon iconName={IconName.ExportKeys} />,
            label: <span>{stringGetter({ key: STRING_KEYS.EXPORT_SECRET_PHRASE })}</span>,
            highlightColor: 'destroy' as const,
            onSelect: () => dispatch(openDialog(DialogTypes.MnemonicExport())),
          },
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

const $Column = styled.div`
  ${layoutMixins.column}
`;
const $label = styled.div`
  ${layoutMixins.row}

  gap: 0.25rem;
  font-size: var(--fontSize-mini);
  color: var(--color-text-0);

  --asset-icon-size: 1rem;
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

const $AddressCopyButton = styled(CopyButton)`
  --button-padding: 0 0.375rem;
`;
