import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import styled, { css } from 'styled-components';

import type { Nullable, TradeState } from '@/constants/abacus';
import { ButtonShape, ButtonSize } from '@/constants/buttons';
import { ComplianceStates } from '@/constants/compliance';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { DydxChainAsset } from '@/constants/wallets';

import { useAccounts, useBreakpoints, useStringGetter } from '@/hooks';
import { useComplianceState } from '@/hooks/useComplianceState';

import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Details } from '@/components/Details';
import { Icon, IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { MarginUsageRing } from '@/components/MarginUsageRing';
import { Output, OutputType } from '@/components/Output';
import { UsageBars } from '@/components/UsageBars';
import { WithTooltip } from '@/components/WithTooltip';

import { calculateIsAccountLoading } from '@/state/accountCalculators';
import { getSubaccount } from '@/state/accountSelectors';
import { openDialog } from '@/state/dialogs';
import { getInputErrors } from '@/state/inputsSelectors';
import { getCurrentMarketId } from '@/state/perpetualsSelectors';

import { isNumber, MustBigNumber } from '@/lib/numbers';

import { AccountInfoDiffOutput } from './AccountInfoDiffOutput';

enum AccountInfoItem {
  BuyingPower = 'buying-power',
  Equity = 'equity',
  MarginUsage = 'margin-usage',
  Leverage = 'leverage',
}

const getUsageValue = (value: Nullable<TradeState<number>>) => {
  const currentValue = value?.current;
  const postOrderValue = value?.postOrder;
  const hasDiffPostOrder = postOrderValue !== null && currentValue !== postOrderValue;
  return (hasDiffPostOrder ? postOrderValue : currentValue) ?? 0;
};

export const AccountInfoConnectedState = () => {
  const stringGetter = useStringGetter();

  const dispatch = useDispatch();
  const { isTablet } = useBreakpoints();
  const { complianceState } = useComplianceState();

  const { dydxAccounts } = useAccounts();

  const inputErrors = useSelector(getInputErrors, shallowEqual);
  const currentMarketId = useSelector(getCurrentMarketId);
  const subAccount = useSelector(getSubaccount, shallowEqual);
  const isLoading = useSelector(calculateIsAccountLoading);

  const listOfErrors = inputErrors?.map(({ code }: { code: string }) => code);

  const { buyingPower, equity, marginUsage, leverage } = subAccount || {};

  const hasDiff =
    (marginUsage?.postOrder !== null &&
      !MustBigNumber(marginUsage?.postOrder).eq(MustBigNumber(marginUsage?.current))) ||
    (buyingPower?.postOrder !== null &&
      !MustBigNumber(buyingPower?.postOrder).eq(MustBigNumber(buyingPower?.current)));

  const showHeader = !hasDiff && !isTablet;

  return (
    <$ConnectedAccountInfoContainer $showHeader={showHeader}>
      {!showHeader ? null : (
        <$Header>
          <span>{stringGetter({ key: STRING_KEYS.ACCOUNT })}</span>
          <$TransferButtons>
            <$Button
              state={{ isDisabled: !dydxAccounts }}
              onClick={() => dispatch(openDialog({ type: DialogTypes.Withdraw }))}
              shape={ButtonShape.Rectangle}
              size={ButtonSize.XSmall}
            >
              {stringGetter({ key: STRING_KEYS.WITHDRAW })}
            </$Button>
            {complianceState === ComplianceStates.FULL_ACCESS && (
              <>
                <$Button
                  state={{ isDisabled: !dydxAccounts }}
                  onClick={() => dispatch(openDialog({ type: DialogTypes.Deposit }))}
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
                        openDialog({
                          type: DialogTypes.Transfer,
                          dialogProps: { selectedAsset: DydxChainAsset.USDC },
                        })
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
            onClick={() => dispatch(openDialog({ type: DialogTypes.Deposit }))}
          >
            <$CircleContainer>
              <Icon iconName={IconName.Transfer} />
            </$CircleContainer>
          </$CornerButton>
        )}
        <$Details
          items={[
            {
              key: AccountInfoItem.Leverage,
              // hasError:
              //   listOfErrors?.includes('INVALID_LARGE_POSITION_LEVERAGE') ||
              //   listOfErrors?.includes('INVALID_NEW_POSITION_LEVERAGE'),
              tooltip: 'leverage',
              isPositive: !MustBigNumber(leverage?.postOrder).gt(MustBigNumber(leverage?.current)),
              label: stringGetter({ key: STRING_KEYS.LEVERAGE }),
              type: OutputType.Multiple,
              value: leverage,
              slotRight: <$UsageBars value={getUsageValue(leverage)} />,
            },
            {
              key: AccountInfoItem.Equity,
              // hasError: isNumber(equity?.postOrder) && MustBigNumber(equity?.postOrder).lt(0),
              tooltip: 'equity',
              isPositive: MustBigNumber(equity?.postOrder).gt(MustBigNumber(equity?.current)),
              label: stringGetter({ key: STRING_KEYS.EQUITY }),
              type: OutputType.Fiat,
              value: equity,
            },
            {
              key: AccountInfoItem.MarginUsage,
              hasError: listOfErrors?.includes('INVALID_NEW_ACCOUNT_MARGIN_USAGE'),
              tooltip: 'margin-usage',
              isPositive: !MustBigNumber(marginUsage?.postOrder).gt(
                MustBigNumber(marginUsage?.current)
              ),
              label: stringGetter({ key: STRING_KEYS.MARGIN_USAGE }),
              type: OutputType.Percent,
              value: marginUsage,
              slotRight: <MarginUsageRing value={getUsageValue(marginUsage)} />,
            },
            {
              key: AccountInfoItem.BuyingPower,
              hasError:
                isNumber(buyingPower?.postOrder) && MustBigNumber(buyingPower?.postOrder).lt(0),
              tooltip: 'buying-power',
              stringParams: { MARKET: currentMarketId },
              isPositive: MustBigNumber(buyingPower?.postOrder).gt(
                MustBigNumber(buyingPower?.current)
              ),
              label: stringGetter({ key: STRING_KEYS.BUYING_POWER }),
              type: OutputType.Fiat,
              value:
                MustBigNumber(buyingPower?.current).lt(0) && buyingPower?.postOrder === null
                  ? undefined
                  : buyingPower,
            },
          ].map(
            ({
              key,
              hasError,
              tooltip = undefined,
              stringParams,
              isPositive,
              label,
              type,
              value,
              slotRight,
            }) => ({
              key,
              label: (
                <WithTooltip tooltip={tooltip} stringParams={stringParams}>
                  <$WithUsage>
                    {label}
                    {hasError ? <$CautionIcon iconName={IconName.CautionCircle} /> : slotRight}
                  </$WithUsage>
                </WithTooltip>
              ),
              value: [AccountInfoItem.Leverage, AccountInfoItem.Equity].includes(key) ? (
                <$Output type={type} value={value?.current} />
              ) : (
                <AccountInfoDiffOutput
                  hasError={hasError}
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
        ? `calc(var(--account-info-section-height) / 2)`
        : `calc((var(--account-info-section-height) - var(--tabs-height)) / 2)`};

    padding: 0.625rem 1rem;
  }

  @media ${breakpoints.tablet} {
    clip-path: none;

    > * {
      padding: 1.25rem 1.875rem;
    }
  }
`;

const $UsageBars = styled(UsageBars)`
  margin-top: -0.125rem;
`;

const $Output = styled(Output)<{ isNegative?: boolean }>`
  color: var(--color-text-1);
  font: var(--font-base-book);
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
