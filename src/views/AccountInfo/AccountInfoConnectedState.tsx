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
import { getIsClosingIsolatedMarginPosition } from '@/state/inputsCalculator';
import { getInputErrors } from '@/state/inputsSelectors';

import { isNumber, MustBigNumber } from '@/lib/numbers';
import { getTradeStateWithDoubleValuesHasDiff } from '@/lib/tradeData';

import { AccountInfoDiffOutput } from './AccountInfoDiffOutput';

enum AccountInfoItem {
  BuyingPower = 'buying-power',
  MarginUsage = 'margin-usage',
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

  const inputErrors = useAppSelector(getInputErrors, shallowEqual);
  const subAccount = useAppSelector(getSubaccount, shallowEqual);
  const isLoading = useAppSelector(calculateIsAccountLoading);
  const isClosingIsolatedPosition = useAppSelector(getIsClosingIsolatedMarginPosition);

  const listOfErrors = inputErrors?.map(({ code }: { code: string }) => code);

  const { freeCollateral, marginUsage } = subAccount ?? {};

  /**
   * TODO: isClosingIsolatedPosition controls whether diff state is shown. Remove when diff state is fixed in Abacus.
   */
  const hasDiff =
    !isClosingIsolatedPosition &&
    ((!!marginUsage?.postOrder && getTradeStateWithDoubleValuesHasDiff(marginUsage)) ||
      (!!freeCollateral?.postOrder && getTradeStateWithDoubleValuesHasDiff(freeCollateral)));

  const showHeader = !hasDiff && !isTablet;

  return (
    <$ConnectedAccountInfoContainer $showHeader={showHeader}>
      {!showHeader ? null : (
        <$Header>
          <span>{stringGetter({ key: STRING_KEYS.ACCOUNT })}</span>
          <$TransferButtons>
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
          </$TransferButtons>
        </$Header>
      )}
      <$Stack>
        {!showHeader && !isTablet && complianceState === ComplianceStates.FULL_ACCESS && (
          <$CornerButton
            state={{ isDisabled: !dydxAccounts }}
            onClick={() => dispatch(openDialog(DialogTypes.Deposit()))}
          >
            <$CircleContainer>
              <Icon iconName={IconName.Transfer} />
            </$CircleContainer>
          </$CornerButton>
        )}
        <$Details
          items={[
            {
              key: AccountInfoItem.MarginUsage,
              hasError: listOfErrors?.includes('INVALID_NEW_ACCOUNT_MARGIN_USAGE'),
              tooltip: 'cross-margin-usage',
              isPositive: !MustBigNumber(marginUsage?.postOrder).gt(
                MustBigNumber(marginUsage?.current)
              ),
              label: stringGetter({ key: STRING_KEYS.CROSS_MARGIN_USAGE }),
              type: OutputType.Percent,
              value: marginUsage,
              slotRight: <MarginUsageRing value={getUsageValue(marginUsage)} />,
            },
            {
              key: AccountInfoItem.BuyingPower,
              hasError:
                isNumber(freeCollateral?.postOrder) &&
                MustBigNumber(freeCollateral?.postOrder).lt(0),
              tooltip: 'cross-free-collateral',
              isPositive: MustBigNumber(freeCollateral?.postOrder).gt(
                MustBigNumber(freeCollateral?.current)
              ),
              label: stringGetter({ key: STRING_KEYS.CROSS_FREE_COLLATERAL }),
              type: OutputType.Fiat,
              value:
                MustBigNumber(freeCollateral?.current).lt(0) && freeCollateral?.postOrder === null
                  ? undefined
                  : freeCollateral,
            },
          ].map(
            ({
              key,
              hasError,
              tooltip = undefined,
              isPositive,
              label,
              type,
              value,
              slotRight,
            }) => ({
              key,
              label: (
                <WithTooltip tooltip={tooltip}>
                  <$WithUsage>
                    {label}
                    {hasError ? <$CautionIcon iconName={IconName.CautionCircle} /> : slotRight}
                  </$WithUsage>
                </WithTooltip>
              ),
              value: (
                <AccountInfoDiffOutput
                  hasError={hasError}
                  isPositive={isPositive}
                  type={type}
                  value={value}
                  hideDiff={isClosingIsolatedPosition}
                />
              ),
            })
          )}
          layout="grid"
          withOverflow={false}
          showHeader={showHeader}
          isLoading={isLoading}
        />
      </$Stack>
    </$ConnectedAccountInfoContainer>
  );
};
const $Stack = styled.div`
  ${layoutMixins.stack}
`;

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

const $CircleContainer = styled.div`
  display: inline-flex;
  align-items: center;

  background-color: var(--color-layer-3);
  padding: 0.5em;
  border-radius: 50%;
`;

const $CautionIcon = styled(Icon)`
  color: var(--color-error);
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
    height: ${({ showHeader }) =>
      !showHeader
        ? `calc(var(--account-info-section-height))`
        : `calc((var(--account-info-section-height) - var(--tabs-height)))`};

    padding: 0.625rem 1rem;
  }

  @media ${breakpoints.tablet} {
    clip-path: none;

    > * {
      padding: 1.25rem 1.875rem;
    }
  }
`;

const $Header = styled.header`
  ${layoutMixins.spacedRow}
  font: var(--font-small-book);
  padding: 0 1.25rem;
`;

const $TransferButtons = styled.div`
  ${layoutMixins.inlineRow}
  gap: 1rem;
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
