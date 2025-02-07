import { BonsaiCore } from '@/bonsai/ontology';
import BigNumber from 'bignumber.js';
import { shallowEqual } from 'react-redux';
import styled, { css } from 'styled-components';

import type { Nullable } from '@/constants/abacus';
import { ButtonAction, ButtonShape, ButtonSize, ButtonStyle } from '@/constants/buttons';
import { ComplianceStates } from '@/constants/compliance';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { StatsigFlags } from '@/constants/statsig';

import { useAccounts } from '@/hooks/useAccounts';
import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useComplianceState } from '@/hooks/useComplianceState';
import { useStatsigGateValue } from '@/hooks/useStatsig';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Details } from '@/components/Details';
import { MarginUsageRing } from '@/components/MarginUsageRing';
import { OutputType } from '@/components/Output';
import { WithSeparators } from '@/components/Separator';
import { WithTooltip } from '@/components/WithTooltip';

import { calculateIsAccountLoading } from '@/state/accountCalculators';
import { getSubaccountForPostOrder } from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

import { isNumber, MustBigNumber } from '@/lib/numbers';
import { testFlags } from '@/lib/testFlags';
import { orEmptyObj } from '@/lib/typeUtils';

import { AccountInfoDiffOutput } from './AccountInfoDiffOutput';

enum AccountInfoItem {
  PortfolioValue = 'portfolio-value',
  MarginUsed = 'margin-used',
  AvailableBalance = 'available-balance',
}

const getUsageValue = (value: Nullable<BigNumber>, valuePost: Nullable<number>) => {
  const currentValue = value;
  const postOrderValue = valuePost;
  const hasDiffPostOrder = postOrderValue != null && !currentValue?.eq(postOrderValue);
  return (hasDiffPostOrder ? postOrderValue : currentValue?.toNumber()) ?? 0;
};

export const AccountInfoSection = () => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();

  const { isTablet } = useBreakpoints();
  const { complianceState } = useComplianceState();
  const { dydxAccounts } = useAccounts();

  const subAccountAbacus = orEmptyObj(useAppSelector(getSubaccountForPostOrder, shallowEqual));
  const subAccount = orEmptyObj(useAppSelector(BonsaiCore.account.parentSubaccountSummary.data));
  const isLoadingGuards = useAppSelector(calculateIsAccountLoading);
  const isLoadingData =
    useAppSelector(BonsaiCore.account.parentSubaccountSummary.loading) === 'pending';
  const isLoading = !!isLoadingGuards || isLoadingData;
  const showNewDepositFlow =
    useStatsigGateValue(StatsigFlags.ffDepositRewrite) || testFlags.showNewDepositFlow;
  const showNewWithdrawFlow =
    useStatsigGateValue(StatsigFlags.ffWithdrawRewrite) || testFlags.showNewWithdrawFlow;

  const { freeCollateral: availableBalance, marginUsage, equity: portfolioValue } = subAccount;
  const {
    freeCollateral: availableBalancePost,
    marginUsage: marginUsagePost,
    equity: portfolioValuePost,
  } = subAccountAbacus;

  const isPostOrderBalanceNegative =
    isNumber(availableBalancePost?.postOrder) &&
    MustBigNumber(availableBalancePost.postOrder).lt(0);

  const withdrawButton = (
    <$Button
      state={{ isDisabled: !dydxAccounts }}
      onClick={() =>
        dispatch(
          openDialog(showNewWithdrawFlow ? DialogTypes.Withdraw2({}) : DialogTypes.Withdraw())
        )
      }
      shape={ButtonShape.Rectangle}
      size={ButtonSize.XSmall}
      buttonStyle={ButtonStyle.WithoutBackground}
      action={ButtonAction.Primary}
    >
      {stringGetter({ key: STRING_KEYS.WITHDRAW })}
    </$Button>
  );

  const depositButton = (
    <$Button
      state={{ isDisabled: !dydxAccounts }}
      onClick={() =>
        dispatch(
          openDialog(showNewDepositFlow ? DialogTypes.Deposit2({}) : DialogTypes.Deposit({}))
        )
      }
      shape={ButtonShape.Rectangle}
      size={ButtonSize.XSmall}
      buttonStyle={ButtonStyle.WithoutBackground}
      action={ButtonAction.Primary}
    >
      {stringGetter({ key: STRING_KEYS.DEPOSIT })}
    </$Button>
  );

  const depositWithdrawRow = (
    <div tw="inlineRow gap-0.5 self-stretch">
      <$WithSeparators layout="row" withSeparators>
        {complianceState === ComplianceStates.FULL_ACCESS && depositButton}
        {withdrawButton}
      </$WithSeparators>
    </div>
  );

  const detailItems = [
    {
      key: AccountInfoItem.PortfolioValue,
      label: (
        <WithTooltip tooltip="portfolio-value" side="left">
          {stringGetter({ key: STRING_KEYS.PORTFOLIO_VALUE })}
        </WithTooltip>
      ),
      value: (
        <AccountInfoDiffOutput
          hasError={false}
          hideDiff
          isPositive={MustBigNumber(portfolioValuePost?.postOrder).gt(
            MustBigNumber(portfolioValue)
          )}
          type={OutputType.Fiat}
          value={portfolioValue}
          valuePost={portfolioValuePost?.postOrder}
        />
      ),
    },
    {
      key: AccountInfoItem.AvailableBalance,
      label: (
        <WithTooltip tooltip="available-balance" side="left">
          {stringGetter({ key: STRING_KEYS.AVAILABLE_BALANCE })}
        </WithTooltip>
      ),
      value: (
        <AccountInfoDiffOutput
          hasError={isPostOrderBalanceNegative}
          hideDiff={isPostOrderBalanceNegative}
          isPositive={MustBigNumber(availableBalancePost?.postOrder).gt(
            MustBigNumber(availableBalance)
          )}
          type={OutputType.Fiat}
          value={
            MustBigNumber(availableBalance).lt(0) && availableBalancePost?.postOrder === null
              ? undefined
              : availableBalance
          }
          valuePost={availableBalancePost?.postOrder}
        />
      ),
    },
    {
      key: AccountInfoItem.MarginUsed,
      label: (
        <WithTooltip tooltip="margin-used" side="left">
          {stringGetter({ key: STRING_KEYS.MARGIN_USED })}
        </WithTooltip>
      ),
      value: (
        <>
          <WithTooltip tooltip="margin-used" side="left">
            <MarginUsageRing value={getUsageValue(marginUsage, marginUsagePost?.postOrder)} />
          </WithTooltip>
          <AccountInfoDiffOutput
            hasError={false}
            isPositive={MustBigNumber(marginUsagePost?.postOrder).gt(MustBigNumber(marginUsage))}
            type={OutputType.Percent}
            value={marginUsage}
            valuePost={marginUsagePost?.postOrder}
          />
        </>
      ),
    },
  ];

  return (
    <$Container>
      <header tw="spacedRow px-1 py-0 font-small-book">
        <span>{stringGetter({ key: STRING_KEYS.YOUR_ACCOUNT })}</span>
        {depositWithdrawRow}
      </header>
      <$StackContainer $isTablet={isTablet}>
        <$Details items={detailItems} layout="column" withOverflow={false} isLoading={isLoading} />
      </$StackContainer>
    </$Container>
  );
};

const $Details = styled(Details)`
  font: var(--font-mini-book);
  padding: 0 1rem;

  > * {
    padding: 0 0 0.5rem;
  }

  @media ${breakpoints.tablet} {
    clip-path: none;

    > * {
      padding: 1.25rem 1.875rem;
    }
  }
`;
const $Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0.5rem 0;
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

const $Button = styled(Button)`
  --button-padding: 0;

  &:hover {
    text-decoration: underline;
  }
`;
