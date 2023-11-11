import { memo } from 'react';
import styled, { AnyStyledComponent } from 'styled-components';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import type { Dispatch } from '@reduxjs/toolkit';

import { OnboardingState } from '@/constants/account';
import { ButtonAction, ButtonShape, ButtonSize, ButtonType } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS, TOOLTIP_STRING_KEYS } from '@/constants/localization';
import { isMainnet } from '@/constants/networks';
import { DydxChainAsset, wallets } from '@/constants/wallets';

import {
  useAccounts,
  useBreakpoints,
  useTokenConfigs,
  useStringGetter,
  useAccountBalance,
  useURLConfigs,
} from '@/hooks';

import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { AssetIcon } from '@/components/AssetIcon';
import { CopyButton } from '@/components/CopyButton';
import { DropdownMenu } from '@/components/DropdownMenu';
import { Output, OutputType } from '@/components/Output';
import { Icon, IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { WithTooltip } from '@/components/WithTooltip';

import { openDialog } from '@/state/dialogs';

import { getOnboardingState, getSubaccount } from '@/state/accountSelectors';

import { isTruthy } from '@/lib/isTruthy';
import { truncateAddress } from '@/lib/wallet';

import { layoutMixins } from '@/styles/layoutMixins';
import { headerMixins } from '@/styles/headerMixins';
import { MustBigNumber } from '@/lib/numbers';


export const AccountMenu = () => {
  const stringGetter = useStringGetter();
  const { mintscanBase } = useURLConfigs();
  const { isTablet } = useBreakpoints();
  const dispatch = useDispatch();
  const onboardingState = useSelector(getOnboardingState);
  const { freeCollateral } = useSelector(getSubaccount, shallowEqual) || {};
  const { nativeTokenBalance } = useAccountBalance();
  const { usdcLabel, chainTokenLabel } = useTokenConfigs();

  const { evmAddress, walletType, dydxAddress, hdKey } = useAccounts();

  const usdcBalance = freeCollateral?.current || 0;

  const onRecoverKeys = () => {
    dispatch(openDialog({ type: DialogTypes.Onboarding }));
  };

  return onboardingState === OnboardingState.Disconnected ? (
    <OnboardingTriggerButton size={ButtonSize.XSmall} />
  ) : (
    <Styled.DropdownMenu
      slotTopContent={
        onboardingState === OnboardingState.AccountConnected && (
          <Styled.AccountInfo>
            <Styled.AddressRow>
              <Styled.AssetIcon symbol="DYDX" />
              <Styled.Column>
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
                  <Styled.label>
                    {stringGetter({ key: STRING_KEYS.DYDX_CHAIN_ADDRESS })}
                  </Styled.label>
                </WithTooltip>
                <Styled.Address>{truncateAddress(dydxAddress)}</Styled.Address>
              </Styled.Column>
              <Styled.CopyButton buttonType="icon" value={dydxAddress} shape={ButtonShape.Square} />
              <Styled.IconButton
                action={ButtonAction.Base}
                href={`${mintscanBase}/account/${dydxAddress}`}
                iconName={IconName.LinkOut}
                shape={ButtonShape.Square}
                type={ButtonType.Link}
              />
            </Styled.AddressRow>
            <Styled.AddressRow>
              {walletType && (
                <Styled.SourceIcon>
                  <Styled.ConnectorIcon iconName={IconName.AddressConnector} />
                  <Icon iconComponent={wallets[walletType].icon} />
                </Styled.SourceIcon>
              )}
              <Styled.Column>
                <Styled.label>{stringGetter({ key: STRING_KEYS.SOURCE_ADDRESS })}</Styled.label>
                <Styled.Address>{truncateAddress(evmAddress, '0x')}</Styled.Address>
              </Styled.Column>
            </Styled.AddressRow>
            <Styled.Balances>
              <div>
                <div>
                  <Styled.label>
                    {stringGetter({
                      key: STRING_KEYS.ASSET_BALANCE,
                      params: { ASSET: chainTokenLabel },
                    })}
                    <AssetIcon symbol={chainTokenLabel} />
                  </Styled.label>
                  <Styled.BalanceOutput type={OutputType.Asset} value={nativeTokenBalance} />
                </div>
                <AssetActions
                  asset={DydxChainAsset.CHAINTOKEN}
                  dispatch={dispatch}
                  hasBalance={nativeTokenBalance.gt(0)}
                />
              </div>
              <div>
                <div>
                  <Styled.label>
                    {stringGetter({
                      key: STRING_KEYS.ASSET_BALANCE,
                      params: { ASSET: usdcLabel },
                    })}
                    <AssetIcon symbol="USDC" />
                  </Styled.label>
                  <Styled.BalanceOutput
                    type={OutputType.Asset}
                    value={usdcBalance}
                    fractionDigits={2}
                  />
                </div>
                <AssetActions
                  asset={DydxChainAsset.USDC}
                  dispatch={dispatch}
                  hasBalance={MustBigNumber(usdcBalance).gt(0)}
                  withOnboarding
                />
              </div>
            </Styled.Balances>
          </Styled.AccountInfo>
        )
      }
      items={[
        onboardingState === OnboardingState.WalletConnected && {
          value: 'ConnectToChain',
          label: (
            <Styled.ConnectToChain>
              <p>{stringGetter({ key: STRING_KEYS.MISSING_KEYS_DESCRIPTION })}</p>
              <OnboardingTriggerButton />
            </Styled.ConnectToChain>
          ),
          onSelect: onRecoverKeys,
          separator: true,
        },
        ...(onboardingState === OnboardingState.AccountConnected && hdKey
          ? [
              !isMainnet && {
                value: 'MobileQrSignIn',
                icon: <Icon iconName={IconName.Qr} />,
                label: stringGetter({ key: STRING_KEYS.TITLE_SIGN_INTO_MOBILE }),
                onSelect: () => dispatch(openDialog({ type: DialogTypes.MobileSignIn })),
              },
              {
                value: 'MnemonicExport',
                icon: <Icon iconName={IconName.ExportKeys} />,
                label: <span>{stringGetter({ key: STRING_KEYS.EXPORT_SECRET_PHRASE })}</span>,
                highlightColor: 'negative',
                onSelect: () => dispatch(openDialog({ type: DialogTypes.MnemonicExport })),
              },
            ].filter(isTruthy)
          : []),
        {
          value: 'Preferences',
          icon: <Icon iconName={IconName.Gear} />,
          label: stringGetter({ key: STRING_KEYS.PREFERENCES }),
          onSelect: () => dispatch(openDialog({ type: DialogTypes.Preferences })),
        },
        {
          value: 'Disconnect',
          icon: <Icon iconName={IconName.BoxClose} />,
          label: stringGetter({ key: STRING_KEYS.DISCONNECT }),
          highlightColor: 'negative',
          onSelect: () => dispatch(openDialog({ type: DialogTypes.DisconnectWallet })),
        },
      ].filter(isTruthy)}
      align="end"
      sideOffset={16}
    >
      {onboardingState === OnboardingState.WalletConnected ? (
        <Styled.WarningIcon iconName={IconName.Warning} />
      ) : onboardingState === OnboardingState.AccountConnected ? (
        walletType && <Icon iconComponent={wallets[walletType].icon} />
      ) : null}
      {!isTablet && <Styled.Address>{truncateAddress(dydxAddress)}</Styled.Address>}
    </Styled.DropdownMenu>
  );
};

const AssetActions = memo(
  ({
    asset,
    dispatch,
    withOnboarding,
    hasBalance,
  }: {
    asset: DydxChainAsset;
    dispatch: Dispatch;
    withOnboarding?: boolean;
    hasBalance?: boolean;
  }) => (
    <Styled.InlineRow>
      {[
        withOnboarding &&
          hasBalance && {
            dialogType: DialogTypes.Withdraw,
            iconName: IconName.Withdraw,
          },
        withOnboarding && {
          dialogType: DialogTypes.Deposit,
          iconName: IconName.Deposit,
        },
        hasBalance && {
          dialogType: DialogTypes.Transfer,
          dialogProps: { selectedAsset: asset },
          iconName: IconName.Send,
        },
      ]
        .filter(isTruthy)
        .map(({ iconName, dialogType, dialogProps }) => (
          <Styled.IconButton
            key={dialogType}
            action={ButtonAction.Base}
            shape={ButtonShape.Square}
            iconName={iconName}
            onClick={() => dispatch(openDialog({ type: dialogType, dialogProps }))}
          />
        ))}
    </Styled.InlineRow>
  )
);

const Styled: Record<string, AnyStyledComponent> = {};

Styled.AccountInfo = styled.div`
  ${layoutMixins.flexColumn}

  gap: 1rem;
  padding: 1rem 1rem 0.5rem 1rem;
`;

Styled.Column = styled.div`
  ${layoutMixins.column}
`;

Styled.InlineRow = styled.div`
  ${layoutMixins.inlineRow}
`;

Styled.AddressRow = styled.div`
  ${layoutMixins.row}

  gap: 0.5rem;

  ${Styled.Column} {
    margin-right: 0.5rem;
  }
`;

Styled.AssetIcon = styled(AssetIcon)`
  z-index: 2;

  font-size: 1.75rem;
`;

Styled.SourceIcon = styled.div`
  padding: 0.375rem;
  position: relative;
  z-index: 1;

  font-size: 1rem;

  line-height: 0;
  border-radius: 50%;
  background-color: #303045;
`;

Styled.ConnectorIcon = styled(Icon)`
  position: absolute;
  top: -1.625rem;
  height: 1.75rem;
`;

Styled.label = styled.div`
  ${layoutMixins.row}

  gap: 0.25rem;
  font-size: var(--fontSize-mini);
  color: var(--color-text-0);

  img {
    font-size: 1rem;
  }
`;

Styled.Balances = styled.div`
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

Styled.BalanceOutput = styled(Output)`
  font-size: var(--fontSize-medium);
`;

Styled.DropdownMenu = styled(DropdownMenu)`
  ${headerMixins.dropdownTrigger}

  --dropdownMenu-item-font-size: 0.875rem;
  --popover-padding: 0 0 0.5rem 0;
`;

Styled.WarningIcon = styled(Icon)`
  font-size: 1.25rem;
  color: var(--color-warning);
`;

Styled.Address = styled.span`
  font: var(--font-base-book);
  font-feature-settings: var(--fontFeature-monoNumbers);
`;

Styled.ConnectToChain = styled(Styled.Column)`
  max-width: 12em;
  gap: 0.5rem;
  text-align: center;

  p {
    color: var(--color-text-1);
    font: var(--font-small-book);
  }
`;

Styled.IconButton = styled(IconButton)`
  --button-padding: 0 0.25rem;
  --button-border: solid var(--border-width) var(--color-layer-6);
`;

Styled.CopyButton = styled(CopyButton)`
  --button-padding: 0 0.25rem;
  --button-border: solid var(--border-width) var(--color-layer-6);
`;
