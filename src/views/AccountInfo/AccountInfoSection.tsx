import { shallowEqual } from 'react-redux';
import styled, { css } from 'styled-components';

import type { Nullable, TradeState } from '@/constants/abacus';
import { ButtonAction, ButtonShape, ButtonSize, ButtonStyle } from '@/constants/buttons';
import { ComplianceStates } from '@/constants/compliance';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { DydxChainAsset } from '@/constants/wallets';

import { useAccounts } from '@/hooks/useAccounts';
import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useComplianceState } from '@/hooks/useComplianceState';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Details } from '@/components/Details';
import { Icon, IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { MarginUsageRing } from '@/components/MarginUsageRing';
import { OutputType } from '@/components/Output';
import { WithSeparators } from '@/components/Separator';
import { WithTooltip } from '@/components/WithTooltip';

import { calculateIsAccountLoading } from '@/state/accountCalculators';
import { getSubaccount } from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

import { isNumber, MustBigNumber } from '@/lib/numbers';
import { testFlags } from '@/lib/testFlags';

import { AccountInfoDiffOutput } from './AccountInfoDiffOutput';

enum AccountInfoItem {
  PortfolioValue = 'portfolio-value',
  MarginUsed = 'margin-used',

  // TODO: CT-1292 remove deprecated fields
  AvailableBalance = 'available-balance',
}

const getUsageValue = (value: Nullable<TradeState<number>>) => {
  const currentValue = value?.current;
  const postOrderValue = value?.postOrder;
  const hasDiffPostOrder = postOrderValue !== null && currentValue !== postOrderValue;
  return (hasDiffPostOrder ? postOrderValue : currentValue) ?? 0;
};

export const AccountInfoSection = () => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();

  const { isTablet } = useBreakpoints();
  const { complianceState } = useComplianceState();
  const { dydxAccounts } = useAccounts();

  const subAccount = useAppSelector(getSubaccount, shallowEqual);
  const isLoading = useAppSelector(calculateIsAccountLoading);

  const { uiRefresh } = testFlags;

  const { freeCollateral: availableBalance, marginUsage } = subAccount ?? {};
  const portfolioValue = subAccount?.equity;

  const isPostOrderBalanceNegative =
    isNumber(availableBalance?.postOrder) && MustBigNumber(availableBalance?.postOrder).lt(0);

  const withdrawButton = (
    <$Button
      state={{ isDisabled: !dydxAccounts }}
      onClick={() => dispatch(openDialog(DialogTypes.Withdraw()))}
      shape={ButtonShape.Rectangle}
      size={ButtonSize.XSmall}
      buttonStyle={uiRefresh ? ButtonStyle.WithoutBackground : ButtonStyle.Default}
      action={uiRefresh ? ButtonAction.Primary : undefined}
      $uiRefreshEnabled={uiRefresh}
    >
      {stringGetter({ key: STRING_KEYS.WITHDRAW })}
    </$Button>
  );

  const depositButton = (
    <$Button
      state={{ isDisabled: !dydxAccounts }}
      onClick={() => dispatch(openDialog(DialogTypes.Deposit()))}
      shape={ButtonShape.Rectangle}
      size={ButtonSize.XSmall}
      buttonStyle={uiRefresh ? ButtonStyle.WithoutBackground : ButtonStyle.Default}
      action={uiRefresh ? ButtonAction.Primary : undefined}
      $uiRefreshEnabled={uiRefresh}
    >
      {stringGetter({ key: STRING_KEYS.DEPOSIT })}
    </$Button>
  );

  const deprecatedActionButtons = (
    <div tw="inlineRow gap-1">
      {withdrawButton}
      {complianceState === ComplianceStates.FULL_ACCESS && (
        <>
          {depositButton}
          <WithTooltip tooltipString={stringGetter({ key: STRING_KEYS.TRANSFER })}>
            <$IconButton
              shape={ButtonShape.Square}
              iconName={IconName.Send}
              onClick={() =>
                dispatch(openDialog(DialogTypes.Transfer({ selectedAsset: DydxChainAsset.USDC })))
              }
            />
          </WithTooltip>
        </>
      )}
    </div>
  );

  const depositWithdrawRow = (
    <div tw="inlineRow gap-0.5 self-stretch">
      <$WithSeparators layout="row" withSeparators>
        {depositButton}
        {complianceState === ComplianceStates.FULL_ACCESS && withdrawButton}
      </$WithSeparators>
    </div>
  );

  const deprecatedDetailItems = [
    {
      key: AccountInfoItem.PortfolioValue,
      hideDiff: true,
      hasError: false,
      isPositive: MustBigNumber(portfolioValue?.postOrder).gt(
        MustBigNumber(portfolioValue?.current)
      ),
      label: stringGetter({ key: STRING_KEYS.PORTFOLIO_VALUE }),
      type: OutputType.Fiat,
      value: portfolioValue,
    },
    {
      key: AccountInfoItem.AvailableBalance,
      hasError: isPostOrderBalanceNegative,
      hideDiff: isPostOrderBalanceNegative,
      isPositive: MustBigNumber(availableBalance?.postOrder).gt(
        MustBigNumber(availableBalance?.current)
      ),
      label: stringGetter({ key: STRING_KEYS.AVAILABLE_BALANCE }),
      type: OutputType.Fiat,
      value:
        MustBigNumber(availableBalance?.current).lt(0) && availableBalance?.postOrder === null
          ? undefined
          : availableBalance,
      slotRight: (
        <WithTooltip tooltip="cross-margin-usage">
          <MarginUsageRing value={getUsageValue(marginUsage)} />
        </WithTooltip>
      ),
    },
  ].map(({ key, hasError, hideDiff = false, isPositive, label, type, value, slotRight }) => ({
    key,
    label: (
      <$WithUsage>
        {label}
        {hasError ? <Icon iconName={IconName.CautionCircle} tw="text-color-error" /> : slotRight}
      </$WithUsage>
    ),
    value: (
      <AccountInfoDiffOutput
        hasError={hasError}
        hideDiff={hideDiff}
        isPositive={isPositive}
        type={type}
        value={value}
      />
    ),
  }));

  const detailItems = [
    {
      key: AccountInfoItem.PortfolioValue,
      label: (
        <WithTooltip tooltip="margin-used">
          {stringGetter({ key: STRING_KEYS.PORTFOLIO_VALUE })}
        </WithTooltip>
      ),
      value: (
        <AccountInfoDiffOutput
          hasError={false}
          hideDiff
          isPositive={MustBigNumber(portfolioValue?.postOrder).gt(
            MustBigNumber(portfolioValue?.current)
          )}
          type={OutputType.Fiat}
          value={portfolioValue}
        />
      ),
    },
    {
      key: AccountInfoItem.MarginUsed,
      label: (
        <WithTooltip tooltip="margin-used">
          {stringGetter({ key: STRING_KEYS.MARGIN_USED })}
        </WithTooltip>
      ),
      value: (
        <>
          <WithTooltip tooltip="cross-margin-usage">
            <MarginUsageRing value={getUsageValue(marginUsage)} />
          </WithTooltip>
          <AccountInfoDiffOutput
            hasError={false}
            hideDiff
            isPositive={MustBigNumber(marginUsage?.postOrder).gt(
              MustBigNumber(marginUsage?.current)
            )}
            type={OutputType.Percent}
            value={marginUsage}
          />
        </>
      ),
      valueSlotLeft: (
        <WithTooltip tooltip="cross-margin-usage">
          <MarginUsageRing value={getUsageValue(marginUsage)} />
        </WithTooltip>
      ),
    },
  ];

  return (
    <$Container $uiRefreshEnabled={uiRefresh}>
      <header tw="spacedRow px-1 py-0 font-small-book">
        <span>
          {stringGetter({ key: uiRefresh ? STRING_KEYS.YOUR_ACCOUNT : STRING_KEYS.ACCOUNT })}
        </span>
        {uiRefresh ? depositWithdrawRow : deprecatedActionButtons}
      </header>
      <$StackContainer $isTablet={isTablet}>
        <$Details
          items={uiRefresh ? detailItems : deprecatedDetailItems}
          layout="column"
          withOverflow={false}
          isLoading={isLoading}
          $uiRefreshEnabled={uiRefresh}
        />
      </$StackContainer>
    </$Container>
  );
};

const $WithUsage = styled.div`
  ${layoutMixins.row}

  & > :last-child {
    margin-left: 0.4rem;
  }

  @media ${breakpoints.tablet} {
    justify-content: end;
  }
`;

const $Details = styled(Details)<{ $uiRefreshEnabled: boolean }>`
  font: var(--font-mini-book);

  ${({ $uiRefreshEnabled }) =>
    $uiRefreshEnabled
      ? css`
          padding: 0 1rem;

          > :first-child {
            padding: 0;
          }

          > *:not(:first-child) {
            padding: 0.5rem 0 0;
          }
        `
      : css`
          padding: 0.25rem 1rem;

          > * {
            padding: 0;
            display: flex;
            clip-path: inset(0.5rem 1px);
          }
        `}

  @media ${breakpoints.tablet} {
    clip-path: none;

    > * {
      padding: 1.25rem 1.875rem;
    }
  }
`;
const $Container = styled.div<{ $uiRefreshEnabled: boolean }>`
  ${({ $uiRefreshEnabled }) =>
    $uiRefreshEnabled
      ? css`
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 0.5rem 0;
        `
      : css`
          ${layoutMixins.column}
          grid-template-rows: var(--tabs-height) 1fr;

          @media ${breakpoints.notTablet} {
            ${layoutMixins.withOuterAndInnerBorders}
            > *:last-child {
              box-shadow: none;
            }
          }
        `};
`;

const $StackContainer = styled.div<{ $isTablet: boolean }>`
  ${layoutMixins.stack}

  ${({ $isTablet }) =>
    $isTablet &&
    css`
      flex: 1;
    `}
`;

const $WithSeparators = styled(WithSeparators)`
  --separatorHeight-padding: 0.5rem;
`;

const $Button = styled(Button)<{ $uiRefreshEnabled: boolean }>`
  ${({ $uiRefreshEnabled }) =>
    $uiRefreshEnabled
      ? css`
          --button-padding: 0;
        `
      : css`
          margin-right: -0.3rem;
        `};
`;

const $IconButton = styled(IconButton)`
  --button-padding: 0 0.25rem;
  --button-border: solid var(--border-width) var(--color-layer-6);
`;
