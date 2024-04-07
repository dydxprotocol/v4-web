import { useMemo, useState } from 'react';

import { TooltipContextType } from '@visx/xychart';
import BigNumber from 'bignumber.js';
import { shallowEqual, useSelector } from 'react-redux';
import styled, { AnyStyledComponent, css } from 'styled-components';

import type { Nullable } from '@/constants/abacus';
import { OnboardingState } from '@/constants/account';
import { ComplianceStates } from '@/constants/compliance';
import { STRING_KEYS } from '@/constants/localization';
import { NumberSign } from '@/constants/numbers';

import { useBreakpoints, useStringGetter } from '@/hooks';
import { useComplianceState } from '@/hooks/useComplianceState';

import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';

import { Output, OutputType, ShowSign } from '@/components/Output';
import { TriangleIndicator } from '@/components/TriangleIndicator';
import { WithLabel } from '@/components/WithLabel';
import { PnlChart, type PnlDatum } from '@/views/charts/PnlChart';
import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { getOnboardingState, getSubaccount } from '@/state/accountSelectors';
import { getSelectedLocale } from '@/state/localizationSelectors';

import { isTruthy } from '@/lib/isTruthy';
import { MustBigNumber } from '@/lib/numbers';

export const usePortfolioValues = ({
  equity,
  visibleData,
  activeDatum,
}: {
  equity?: Nullable<number>;
  visibleData?: PnlDatum[];
  activeDatum?: PnlDatum;
}) => {
  const stringGetter = useStringGetter();
  const selectedLocale = useSelector(getSelectedLocale);

  const accountValueLabel = useMemo(
    () =>
      activeDatum
        ? new Date(activeDatum.createdAt).toLocaleString(selectedLocale, {
            dateStyle: 'medium',
            timeStyle: 'short',
          })
        : stringGetter({ key: STRING_KEYS.PORTFOLIO_VALUE }),
    [activeDatum, stringGetter]
  );

  const accountEquity = useMemo(
    () => (activeDatum ? activeDatum.equity : equity),
    [activeDatum, equity]
  );

  const earliestVisibleDatum = visibleData?.[0];
  const latestVisibleDatum = visibleData?.[visibleData?.length - 1];

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
  }, [activeDatum, earliestVisibleDatum, latestVisibleDatum]);

  return {
    accountValueLabel,
    accountEquity,
    pnlDiff: pnl?.pnlDiff,
    pnlDiffPercent: pnl?.pnlDiffPercent,
    pnlDiffSign: pnl?.sign || NumberSign.Neutral,
  };
};

export const AccountDetailsAndHistory = () => {
  const stringGetter = useStringGetter();
  const { isTablet } = useBreakpoints();
  const { complianceState } = useComplianceState();
  const selectedLocale = useSelector(getSelectedLocale);
  const onboardingState = useSelector(getOnboardingState);

  const { buyingPower, equity, freeCollateral, leverage, marginUsage } =
    useSelector(getSubaccount, shallowEqual) || {};

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
    <Styled.AccountDetailsAndHistory>
      <Styled.AccountValue>
        <Styled.WithLabel label={accountValueLabel}>
          <Styled.AccountEquity>
            <Output
              type={OutputType.Fiat}
              value={accountEquity}
              roundingMode={BigNumber.ROUND_FLOOR}
              withBaseFont
            />
          </Styled.AccountEquity>
          <Styled.PnlDiff isPositive={MustBigNumber(pnlDiff).gte(0)}>
            {pnlDiff && <TriangleIndicator value={MustBigNumber(pnlDiff)} />}
            <Output type={OutputType.Fiat} showSign={ShowSign.None} value={pnlDiff} />
            {pnlDiffPercent && MustBigNumber(pnlDiffPercent).isFinite() && (
              <Styled.OutputInParentheses type={OutputType.Percent} value={pnlDiffPercent} />
            )}
          </Styled.PnlDiff>
        </Styled.WithLabel>
      </Styled.AccountValue>

      {accountDetailsConfig.map(({ key, labelKey, type, value }) => (
        <Styled.AccountDetail key={key} gridArea={key}>
          <Styled.WithLabel label={stringGetter({ key: labelKey })}>
            <Output type={type} value={value} />
          </Styled.WithLabel>
        </Styled.AccountDetail>
      ))}

      <Styled.PnlChart
        pnlDiffSign={pnlDiffSign}
        onTooltipContext={setTooltipContext}
        onVisibleDataChange={setVisibleData}
        selectedLocale={selectedLocale}
        slotEmpty={
          <Styled.EmptyChart>
            {complianceState === ComplianceStates.READ_ONLY ? (
              <Styled.EmptyCard>
                Perpetuals are not available to any persons who are residents of, are located or
                incorporated in, or have a registered agent in a blocked country or a restricted
                territory. More details can be found in our Terms of Use
              </Styled.EmptyCard>
            ) : onboardingState !== OnboardingState.AccountConnected ? (
              <Styled.EmptyCard>
                <p>
                  {stringGetter({
                    key: {
                      [OnboardingState.Disconnected]: STRING_KEYS.CONNECT_YOUR_WALLET_EXTENDED,
                      [OnboardingState.WalletConnected]: STRING_KEYS.MISSING_KEYS_DESCRIPTION,
                    }[onboardingState],
                  })}
                </p>
                <OnboardingTriggerButton />
              </Styled.EmptyCard>
            ) : null}
          </Styled.EmptyChart>
        }
      />
    </Styled.AccountDetailsAndHistory>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.AccountDetailsAndHistory = styled.div<{ isSidebarOpen: boolean }>`
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

Styled.WithLabel = styled(WithLabel)`
  --label-textColor: var(--color-text-0);

  label {
    font: var(--font-small-book);
  }
`;

Styled.AccountValue = styled.div`
  grid-area: PortfolioValue;

  padding: 1.25rem;

  label {
    margin-bottom: 0.875rem;
  }
`;

Styled.AccountEquity = styled.div`
  font: var(--font-extra-book);
  color: var(--color-text-2);
`;

Styled.PnlDiff = styled.div<{ isPositive: boolean }>`
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

Styled.OutputInParentheses = styled(Output)`
  &:before {
    content: '(';
  }
  &:after {
    content: ')';
  }
`;

Styled.AccountDetail = styled.div<{ gridArea: string }>`
  grid-area: ${({ gridArea }) => gridArea};

  padding: 1.25rem;
  display: grid;
  align-items: center;
`;

Styled.PnlChart = styled(PnlChart)<{ pnlDiffSign: NumberSign }>`
  grid-area: Chart;
  background-color: var(--color-layer-2);

  --pnl-line-color: ${({ pnlDiffSign }) =>
    ({
      [NumberSign.Positive]: 'var(--color-positive)',
      [NumberSign.Negative]: 'var(--color-negative)',
      [NumberSign.Neutral]: 'var(--color-text-1)',
    }[pnlDiffSign])};
`;

Styled.EmptyChart = styled.div`
  display: grid;
  cursor: default;
`;

Styled.EmptyCard = styled.div`
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
