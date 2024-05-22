import type { RenderTooltipParams } from '@visx/xychart/lib/components/Tooltip';
import styled from 'styled-components';

import { FundingRateResolution, type FundingChartDatum } from '@/constants/charts';
import { STRING_KEYS } from '@/constants/localization';
import { FundingDirection } from '@/constants/markets';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Details, DetailsItem } from '@/components/Details';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { TooltipContent } from '@/components/visx/TooltipContent';

type FundingChartTooltipProps = {
  fundingRateView: FundingRateResolution;
  latestDatum: FundingChartDatum;
} & Pick<RenderTooltipParams<FundingChartDatum>, 'tooltipData'>;

export const FundingChartTooltipContent = ({
  fundingRateView,
  latestDatum,
  tooltipData,
}: FundingChartTooltipProps) => {
  const { nearestDatum } = tooltipData ?? {};
  const stringGetter = useStringGetter();

  const tooltipDatum = nearestDatum?.datum ?? latestDatum;
  const isShowingCurrentFundingRate = tooltipDatum === latestDatum;

  return (
    <TooltipContent
      accentColor={
        {
          [FundingDirection.ToLong]: 'var(--color-negative)',
          [FundingDirection.ToShort]: 'var(--color-positive)',
          [FundingDirection.None]: 'var(--color-layer-6)',
        }[tooltipDatum.direction]
      }
    >
      <h4>
        {isShowingCurrentFundingRate
          ? stringGetter({ key: STRING_KEYS.CURRENT_FUNDING_RATE })
          : stringGetter({ key: STRING_KEYS.HISTORICAL_FUNDING_RATE })}
      </h4>

      <$Details
        layout="column"
        items={
          [
            {
              key: 'direction',
              label: stringGetter({ key: STRING_KEYS.DIRECTION }),
              value: (
                <Output
                  type={OutputType.Text}
                  value={
                    {
                      [FundingDirection.ToLong]: `${stringGetter({
                        key: STRING_KEYS.SHORT_POSITION_SHORT,
                      })} → ${stringGetter({
                        key: STRING_KEYS.LONG_POSITION_SHORT,
                      })}`,
                      [FundingDirection.ToShort]: `${stringGetter({
                        key: STRING_KEYS.LONG_POSITION_SHORT,
                      })} → ${stringGetter({
                        key: STRING_KEYS.SHORT_POSITION_SHORT,
                      })}`,
                      [FundingDirection.None]: undefined,
                    }[tooltipDatum.direction]
                  }
                />
              ),
            },
            {
              key: 'fundingRate',
              label: stringGetter({
                key: {
                  [FundingRateResolution.OneHour]: STRING_KEYS.RATE_1H,
                  [FundingRateResolution.EightHour]: STRING_KEYS.RATE_8H,
                  [FundingRateResolution.Annualized]: STRING_KEYS.ANNUALIZED,
                }[fundingRateView],
              }),
              value: (
                <Output
                  type={OutputType.SmallPercent}
                  value={
                    {
                      [FundingRateResolution.OneHour]: tooltipDatum.fundingRate,
                      [FundingRateResolution.EightHour]: tooltipDatum.fundingRate * 8,
                      [FundingRateResolution.Annualized]: tooltipDatum.fundingRate * (24 * 365),
                    }[fundingRateView]
                  }
                  showSign={ShowSign.Both}
                />
              ),
            },
            {
              key: 'time',
              label: isShowingCurrentFundingRate
                ? 'Time Remaining'
                : stringGetter({ key: STRING_KEYS.TIME }),
              value: <Output type={OutputType.DateTime} value={tooltipDatum.time} />,
            },
          ] satisfies Array<DetailsItem>
        }
      />
    </TooltipContent>
  );
};

const $Details = styled(Details)`
  --details-item-vertical-padding: 0.2rem;
`;
