import { useMemo, useState } from 'react';

import { TooltipContextType } from '@visx/xychart';
import BigNumber from 'bignumber.js';
import { shallowEqual } from 'react-redux';
import styled, { css } from 'styled-components';

import type { Nullable } from '@/constants/abacus';
import { OnboardingState } from '@/constants/account';
import { ComplianceStates } from '@/constants/compliance';
import { STRING_KEYS } from '@/constants/localization';
import { NumberSign } from '@/constants/numbers';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useComplianceState } from '@/hooks/useComplianceState';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { Output, OutputType, ShowSign } from '@/components/Output';
import { TriangleIndicator } from '@/components/TriangleIndicator';
import { WithLabel } from '@/components/WithLabel';
import { PnlChart, type PnlDatum } from '@/views/charts/PnlChart';
import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { getOnboardingState, getSubaccount } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';
import { getSelectedLocale } from '@/state/localizationSelectors';

import { isTruthy } from '@/lib/isTruthy';
import { MustBigNumber } from '@/lib/numbers';

const usePortfolioValues = ({
  equity,
  visibleData,
  activeDatum,
}: {
  equity?: Nullable<number>;
  visibleData?: PnlDatum[];
  activeDatum?: PnlDatum;
}) => {
  const stringGetter = useStringGetter();
  const selectedLocale = useAppSelector(getSelectedLocale);

  const accountValueLabel = useMemo(
    () =>
      activeDatum
        ? new Date(activeDatum.createdAt).toLocaleString(selectedLocale, {
            dateStyle: 'medium',
            timeStyle: 'short',
          })
        : stringGetter({ key: STRING_KEYS.PORTFOLIO_VALUE }),
    [activeDatum, selectedLocale, stringGetter]
  );

  const accountEquity = useMemo(
    () => (activeDatum ? activeDatum.equity : equity),
    [activeDatum, equity]
  );

  const earliestVisibleDatum = visibleData?.[0];
  const latestVisibleDatum = visibleData?.[(visibleData?.length ?? 1) - 1];

  const pnl = useMemo(() => {
    let pnlDiff;
    let pnlDiffPercent;
    if (earliestVisibleDatum && latestVisibleDatum) {
      const fullTimeframeDiff = MustBigNumber(latestVisibleDatum.totalPnl).minus(
        earliestVisibleDatum.totalPnl
      );

      pnlDiff = activeDatum
        ? MustBigNumber(activeDatum.totalPnl).minus(earliestVisibleDatum.totalPnl)
        : fullTimeframeDiff;

      pnlDiffPercent = pnlDiff.div(earliestVisibleDatum.equity);

      return {
        pnlDiff: pnlDiff.toString(),
        pnlDiffPercent: pnlDiffPercent.toString(),
        sign: fullTimeframeDiff.gte(0) ? NumberSign.Positive : NumberSign.Negative,
      };
    }
    return undefined;
  }, [activeDatum, earliestVisibleDatum, latestVisibleDatum]);

  return {
    accountValueLabel,
    accountEquity,
    pnlDiff: pnl?.pnlDiff,
    pnlDiffPercent: pnl?.pnlDiffPercent,
    pnlDiffSign: pnl?.sign ?? NumberSign.Neutral,
  };
};

export const AccountDetailsAndHistory = () => {
  const stringGetter = useStringGetter();
  const { isTablet } = useBreakpoints();
  const { complianceState } = useComplianceState();
  const selectedLocale = useAppSelector(getSelectedLocale);
  const onboardingState = useAppSelector(getOnboardingState);

  const { buyingPower, equity, freeCollateral, leverage, marginUsage } =
    useAppSelector(getSubaccount, shallowEqual) ?? {};

  const [tooltipContext, setTooltipContext] = useState<TooltipContextType<PnlDatum>>();

  const [visibleData, setVisibleData] = useState<PnlDatum[]>();

  const { accountValueLabel, accountEquity, pnlDiff, pnlDiffPercent, pnlDiffSign } =
    usePortfolioValues({
      equity: equity?.current,
      activeDatum: tooltipContext?.tooltipData?.nearestDatum?.datum,
      visibleData,
    });

  const accountDetailsConfig = [
    !isTablet && {
      key: 'MarginUsage',
      labelKey: STRING_KEYS.MARGIN_USAGE,
      type: OutputType.Percent,
      value: marginUsage?.current,
    },
    !isTablet && {
      key: 'FreeCollateral',
      labelKey: STRING_KEYS.FREE_COLLATERAL,
      type: OutputType.Fiat,
      value: freeCollateral?.current,
    },
    {
      key: 'Leverage',
      labelKey: STRING_KEYS.LEVERAGE,
      type: OutputType.Multiple,
      value: leverage?.current,
    },
    {
      key: 'BuyingPower',
      labelKey: STRING_KEYS.BUYING_POWER,
      type: OutputType.Fiat,
      value: MustBigNumber(buyingPower?.current).lt(0) ? undefined : buyingPower?.current, // show '-' when buying power is negative
    },
  ].filter(isTruthy);

  return (
    <$AccountDetailsAndHistory>
      <$AccountValue>
        <$WithLabel label={accountValueLabel}>
          <$AccountEquity>
            <Output
              type={OutputType.Fiat}
              value={accountEquity}
              roundingMode={BigNumber.ROUND_FLOOR}
              withBaseFont
            />
          </$AccountEquity>
          <$PnlDiff isPositive={MustBigNumber(pnlDiff).gte(0)}>
            {pnlDiff && <TriangleIndicator value={MustBigNumber(pnlDiff)} />}
            <Output type={OutputType.Fiat} showSign={ShowSign.None} value={pnlDiff} />
            {pnlDiffPercent && MustBigNumber(pnlDiffPercent).isFinite() && (
              <$OutputInParentheses type={OutputType.Percent} value={pnlDiffPercent} />
            )}
          </$PnlDiff>
        </$WithLabel>
      </$AccountValue>

      {accountDetailsConfig.map(({ key, labelKey, type, value }) => (
        <$AccountDetail key={key} gridArea={key}>
          <$WithLabel label={stringGetter({ key: labelKey })}>
            <Output type={type} value={value} />
          </$WithLabel>
        </$AccountDetail>
      ))}

      <$PnlChart
        pnlDiffSign={pnlDiffSign}
        onTooltipContext={setTooltipContext}
        onVisibleDataChange={setVisibleData}
        selectedLocale={selectedLocale}
        slotEmpty={
          <$EmptyChart>
            {complianceState === ComplianceStates.READ_ONLY ? (
              <$EmptyCard>{stringGetter({ key: STRING_KEYS.BLOCKED_MESSAGE })}</$EmptyCard>
            ) : onboardingState !== OnboardingState.AccountConnected ? (
              <$EmptyCard>
                <p>
                  {stringGetter({
                    key: {
                      [OnboardingState.Disconnected]: STRING_KEYS.CONNECT_YOUR_WALLET_EXTENDED,
                      [OnboardingState.WalletConnected]: STRING_KEYS.MISSING_KEYS_DESCRIPTION,
                    }[onboardingState],
                  })}
                </p>
                <OnboardingTriggerButton />
              </$EmptyCard>
            ) : null}
          </$EmptyChart>
        }
      />
    </$AccountDetailsAndHistory>
  );
};
const $AccountDetailsAndHistory = styled.div<{ isSidebarOpen?: boolean }>`
  height: 100%;

  display: grid;
  grid-template:
    'PortfolioValue PortfolioValue Chart'
    'MarginUsage FreeCollateral Chart'
    'Leverage BuyingPower Chart'
    / 9.375rem 9.375rem 1fr;

  ${layoutMixins.withOuterBorderClipped}
  ${layoutMixins.withOuterAndInnerBorders}

  @media ${breakpoints.tablet} {
    grid-template:
      'PortfolioValue PortfolioValue' auto
      'Leverage BuyingPower' auto
      'Chart Chart' 15rem
      / 1fr 1fr;
  }
`;

const $WithLabel = styled(WithLabel)`
  --label-textColor: var(--color-text-0);

  label {
    font: var(--font-small-book);
  }
`;

const $AccountValue = styled.div`
  grid-area: PortfolioValue;

  padding: 1.25rem;

  label {
    margin-bottom: 0.875rem;
  }
`;

const $AccountEquity = styled.div`
  font: var(--font-extra-book);
  color: var(--color-text-2);
`;

const $PnlDiff = styled.div<{ isPositive: boolean }>`
  color: var(--color-negative);
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.25rem;

  ${({ isPositive }) =>
    isPositive &&
    css`
      color: var(--color-positive);
    `}
`;

const $OutputInParentheses = styled(Output)`
  &:before {
    content: '(';
  }
  &:after {
    content: ')';
  }
`;

const $AccountDetail = styled.div<{ gridArea: string }>`
  grid-area: ${({ gridArea }) => gridArea};

  padding: 1.25rem;
  display: grid;
  align-items: center;
`;

const $PnlChart = styled(PnlChart)<{ pnlDiffSign: NumberSign }>`
  grid-area: Chart;
  background-color: var(--color-layer-2);

  --pnl-line-color: ${({ pnlDiffSign }) =>
    ({
      [NumberSign.Positive]: 'var(--color-positive)',
      [NumberSign.Negative]: 'var(--color-negative)',
      [NumberSign.Neutral]: 'var(--color-text-1)',
    }[pnlDiffSign])};
`;

const $EmptyChart = styled.div`
  display: grid;
  cursor: default;
`;

const $EmptyCard = styled.div`
  width: 16.75rem;

  ${layoutMixins.column};
  font: var(--font-base-book);
  gap: 1rem;

  padding: 1.25rem;
  margin: auto;
  background-color: var(--color-layer-3);
  border-radius: 0.5rem;
  text-align: center;
  justify-items: center;

  button {
    width: fit-content;
  }
`;
