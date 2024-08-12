import { useCallback } from 'react';

import { shallowEqual } from 'react-redux';
import styled, { css } from 'styled-components';

import type { Nullable, TradeState } from '@/constants/abacus';
import { ButtonShape, ButtonSize } from '@/constants/buttons';
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
import { WithTooltip } from '@/components/WithTooltip';

import { calculateIsAccountLoading } from '@/state/accountCalculators';
import { getSubaccount } from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

import { isNumber, MustBigNumber } from '@/lib/numbers';
import { getTradeStateWithDoubleValuesHasDiff } from '@/lib/tradeData';

import { AccountInfoDiffOutput } from './AccountInfoDiffOutput';

enum AccountInfoItem {
  AvailableBalance = 'available-balance',
  PortfolioValue = 'portfolio-value',
}

const getUsageValue = (value: Nullable<TradeState<number>>) => {
  const currentValue = value?.current;
  const postOrderValue = value?.postOrder;
  const hasDiffPostOrder = postOrderValue !== null && currentValue !== postOrderValue;
  return (hasDiffPostOrder ? postOrderValue : currentValue) ?? 0;
};

export const AccountInfoConnectedState = () => {
  const stringGetter = useStringGetter();

  const dispatch = useAppDispatch();
  const { isTablet } = useBreakpoints();
  const { complianceState } = useComplianceState();

  const { dydxAccounts } = useAccounts();

  const subAccount = useAppSelector(getSubaccount, shallowEqual);
  const isLoading = useAppSelector(calculateIsAccountLoading);

  const { freeCollateral: availableBalance, marginUsage } = subAccount ?? {};
  const portfolioValue = subAccount?.equity;

  const hasDiff =
    !!availableBalance?.postOrder && getTradeStateWithDoubleValuesHasDiff(availableBalance);

  const showHeader = !hasDiff && !isTablet;

  const isPostOrderTradeStateNegative = useCallback(
    (tradeStateValue: Nullable<TradeState<number>>) => {
      return (
        isNumber(tradeStateValue?.postOrder) && MustBigNumber(tradeStateValue?.postOrder).lt(0)
      );
    },
    []
  );

  return (
    <$ConnectedAccountInfoContainer $showHeader={showHeader}>
      {!showHeader ? null : (
        <header tw="spacedRow px-1.25 py-0 font-small-book">
          <span>{stringGetter({ key: STRING_KEYS.ACCOUNT })}</span>
          <div tw="inlineRow gap-1">
            <$Button
              state={{ isDisabled: !dydxAccounts }}
              onClick={() => dispatch(openDialog(DialogTypes.Withdraw()))}
              shape={ButtonShape.Rectangle}
              size={ButtonSize.XSmall}
            >
              {stringGetter({ key: STRING_KEYS.WITHDRAW })}
            </$Button>
            {complianceState === ComplianceStates.FULL_ACCESS && (
              <>
                <$Button
                  state={{ isDisabled: !dydxAccounts }}
                  onClick={() => dispatch(openDialog(DialogTypes.Deposit()))}
                  shape={ButtonShape.Rectangle}
                  size={ButtonSize.XSmall}
                >
                  {stringGetter({ key: STRING_KEYS.DEPOSIT })}
                </$Button>
                <WithTooltip tooltipString={stringGetter({ key: STRING_KEYS.TRANSFER })}>
                  <$IconButton
                    shape={ButtonShape.Square}
                    iconName={IconName.Send}
                    onClick={() =>
                      dispatch(
                        openDialog(DialogTypes.Transfer({ selectedAsset: DydxChainAsset.USDC }))
                      )
                    }
                  />
                </WithTooltip>
              </>
            )}
          </div>
        </header>
      )}
      <div tw="stack">
        {!showHeader && !isTablet && complianceState === ComplianceStates.FULL_ACCESS && (
          <$CornerButton
            state={{ isDisabled: !dydxAccounts }}
            onClick={() => dispatch(openDialog(DialogTypes.Deposit()))}
          >
            <div tw="inline-flex items-center rounded-[50%] bg-color-layer-3 p-[0.5em]">
              <Icon iconName={IconName.Transfer} />
            </div>
          </$CornerButton>
        )}
        <$Details
          items={[
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
              hasError: isPostOrderTradeStateNegative(availableBalance),
              isPositive: MustBigNumber(availableBalance?.postOrder).gt(
                MustBigNumber(availableBalance?.current)
              ),
              label: stringGetter({ key: STRING_KEYS.AVAILABLE_BALANCE }),
              type: OutputType.Fiat,
              value:
                MustBigNumber(availableBalance?.current).lt(0) &&
                availableBalance?.postOrder === null
                  ? undefined
                  : availableBalance,
              slotRight: (
                <WithTooltip tooltip="cross-margin-usage">
                  <MarginUsageRing value={getUsageValue(marginUsage)} />
                </WithTooltip>
              ),
            },
          ].map(
            ({ key, hasError, hideDiff = false, isPositive, label, type, value, slotRight }) => ({
              key,
              label: (
                <$WithUsage>
                  {label}
                  {hasError ? (
                    <Icon iconName={IconName.CautionCircle} tw="text-color-error" />
                  ) : (
                    slotRight
                  )}
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
            })
          )}
          layout="grid"
          withOverflow={false}
          showHeader={showHeader}
          isLoading={isLoading}
        />
      </div>
    </$ConnectedAccountInfoContainer>
  );
};
const $CornerButton = styled(Button)`
  ${layoutMixins.withOuterBorder}
  z-index: 1;
  place-self: start end;
  padding: 0.33rem;

  --button-height: var(--tabs-height);
  --button-backgroundColor: var(--color-layer-1);
  --button-radius: 0 0 0 0.5rem;
  --button-border: none;

  @media ${breakpoints.tablet} {
    display: none;
  }
`;
const $WithUsage = styled.div`
  ${layoutMixins.row}

  & > :last-child {
    margin-left: 0.4rem;
  }

  @media ${breakpoints.tablet} {
    justify-content: end;
  }
`;

const $Details = styled(Details)<{ showHeader?: boolean }>`
  ${layoutMixins.withOuterAndInnerBorders}
  clip-path: inset(0.5rem 1px);

  font: var(--font-mini-book);

  > * {
    ${({ showHeader }) =>
      showHeader
        ? css`
            height: calc((var(--account-info-section-height) - var(--tabs-height)));
            padding: 0.625rem 1rem;
          `
        : css`
            height: calc(var(--account-info-section-height));
            padding: 1.25rem 1rem 0.6rem;
          `}
    display: flex;
    flex-direction: column;

    & > :last-child {
      flex-grow: 1;
      align-items: center;
    }
  }

  @media ${breakpoints.tablet} {
    clip-path: none;

    > * {
      padding: 1.25rem 1.875rem;
    }
  }
`;
const $ConnectedAccountInfoContainer = styled.div<{ $showHeader?: boolean }>`
  ${layoutMixins.column}

  @media ${breakpoints.notTablet} {
    ${layoutMixins.withOuterAndInnerBorders}
    > *:last-child {
      box-shadow: none;
    }
  }

  ${({ $showHeader }) =>
    $showHeader &&
    css`
      grid-template-rows: var(--tabs-height) 1fr;
    `}
`;

const $Button = styled(Button)`
  margin-right: -0.3rem;

  svg {
    width: 1.25em;
    height: 1.25em;
  }
`;

const $IconButton = styled(IconButton)`
  --button-padding: 0 0.25rem;
  --button-border: solid var(--border-width) var(--color-layer-6);
`;
