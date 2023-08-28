import styled, { type AnyStyledComponent, css } from 'styled-components';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';

import type { Nullable, TradeState } from '@/constants/abacus';
import { ButtonShape, ButtonSize } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useAccounts, useBreakpoints, useStringGetter } from '@/hooks';

import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Details } from '@/components/Details';
import { Icon, IconName } from '@/components/Icon';
import { MarginUsageRing } from '@/components/MarginUsageRing';
import { Output, OutputType } from '@/components/Output';
import { UsageBars } from '@/components/UsageBars';
import { WithTooltip } from '@/components/WithTooltip';

import { openDialog } from '@/state/dialogs';

import { calculateIsAccountLoading } from '@/state/accountCalculators';
import { getSubaccount } from '@/state/accountSelectors';
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

  const { dydxAccounts } = useAccounts();

  const inputErrors = useSelector(getInputErrors, shallowEqual);
  const currentMarketId = useSelector(getCurrentMarketId);
  const subAccount = useSelector(getSubaccount, shallowEqual);
  const isLoading = useSelector(calculateIsAccountLoading);

  const listOfErrors = inputErrors?.map(({ code }: { code: string }) => code);

  const { buyingPower, equity, marginUsage, leverage } = subAccount || {};

  const hasDiff =
    marginUsage?.postOrder != null &&
    !MustBigNumber(marginUsage?.postOrder).eq(MustBigNumber(marginUsage?.current));

  const showHeader = !hasDiff && !isTablet;

  return (
    <Styled.ConnectedAccountInfoContainer $showHeader={showHeader}>
      {!showHeader ? null : (
        <Styled.Header>
          <span>{stringGetter({ key: STRING_KEYS.ACCOUNT })}</span>
          <Styled.TransferButtons>
            {import.meta.env.MODE !== 'production' && (
              <Styled.Button
                state={{ isDisabled: !dydxAccounts }}
                onClick={() => dispatch(openDialog({ type: DialogTypes.Withdraw }))}
                shape={ButtonShape.Pill}
                size={ButtonSize.XSmall}
              >
                {stringGetter({ key: STRING_KEYS.WITHDRAW })}
              </Styled.Button>
            )}
            <Styled.Button
              state={{ isDisabled: !dydxAccounts }}
              onClick={() => dispatch(openDialog({ type: DialogTypes.Deposit }))}
              shape={ButtonShape.Pill}
              size={ButtonSize.XSmall}
            >
              {stringGetter({ key: STRING_KEYS.DEPOSIT })}
            </Styled.Button>
          </Styled.TransferButtons>
        </Styled.Header>
      )}
      <Styled.Stack>
        {!showHeader && !isTablet && (
          <Styled.CornerButton
            state={{ isDisabled: !dydxAccounts }}
            onClick={() => dispatch(openDialog({ type: DialogTypes.Deposit }))}
          >
            <Styled.CircleContainer>
              <Icon iconName={IconName.Transfer} />
            </Styled.CircleContainer>
          </Styled.CornerButton>
        )}
        <Styled.Details
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
              slotRight: <Styled.UsageBars value={getUsageValue(leverage)} />,
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
              value: buyingPower,
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
                  <Styled.WithUsage>
                    {label}
                    {hasError ? <Styled.Icon iconName={IconName.CautionCircle} /> : slotRight}
                  </Styled.WithUsage>
                </WithTooltip>
              ),
              value: [AccountInfoItem.Leverage, AccountInfoItem.Equity].includes(key) ? (
                <Styled.Output type={type} value={value?.current} />
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
      </Styled.Stack>
    </Styled.ConnectedAccountInfoContainer>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Stack = styled.div`
  ${layoutMixins.stack}
  ${layoutMixins.perspectiveArea}
`;

Styled.CornerButton = styled(Button)`
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

Styled.CircleContainer = styled.div`
  display: inline-flex;
  align-items: center;

  background-color: var(--color-layer-3);
  padding: 0.5em;
  border-radius: 50%;
`;

Styled.Icon = styled(Icon)`
  color: var(--color-negative);
`;

Styled.WithUsage = styled.div`
  ${layoutMixins.row}

  & > :last-child {
    margin-left: 0.4rem;
  }

  @media ${breakpoints.tablet} {
    justify-content: end;
  }
`;

Styled.Details = styled(Details)<{ showHeader?: boolean }>`
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

Styled.UsageBars = styled(UsageBars)`
  margin-top: -0.125rem;
`;

Styled.Output = styled(Output)<{ isNegative?: boolean }>`
  color: var(--color-text-1);
  font: var(--font-base-book);
`;

Styled.Header = styled.header`
  ${layoutMixins.spacedRow}
  font: var(--font-small-book);
  padding: 0 1.25rem;
`;

Styled.TransferButtons = styled.div`
  ${layoutMixins.inlineRow}
  gap: 1rem;
`;

Styled.ConnectedAccountInfoContainer = styled.div<{ $showHeader?: boolean }>`
  ${layoutMixins.column}
  ${layoutMixins.withOuterAndInnerBorders}

  ${({ $showHeader }) =>
    $showHeader &&
    css`
      grid-template-rows: var(--tabs-height) 1fr;
    `}
`;

Styled.Button = styled(Button)`
  margin-right: -0.3rem;

  svg {
    width: 1.25em;
    height: 1.25em;
  }
`;
