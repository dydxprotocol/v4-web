import styled from 'styled-components';

import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { TokenRoute } from '@/constants/routes';

import { usePerpetualMarketsStats, useStringGetter, useTokenConfigs } from '@/hooks';

import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Output, OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { SparklineChart } from '@/components/visx/SparklineChart';

type ExchangeBillboardsProps = {
  className?: string;
};

export const ExchangeBillboards: React.FC<ExchangeBillboardsProps> = ({ className }) => {
  const stringGetter = useStringGetter();
  const { chainTokenLabel } = useTokenConfigs();

  const {
    stats: { volume24HUSDC, openInterestUSDC, feeEarned },
    feeEarnedChart,
  } = usePerpetualMarketsStats();

  return (
    <Styled.MarketBillboardsWrapper className={className}>
      {[
        {
          key: 'volume',
          labelKey: STRING_KEYS.TRADING_VOLUME,
          tagKey: STRING_KEYS._24H,
          value: volume24HUSDC || undefined,
          fractionDigits: 0,
          type: OutputType.CompactFiat,
        },
        {
          key: 'open-interest',
          labelKey: STRING_KEYS.OPEN_INTEREST,
          tagKey: STRING_KEYS.CURRENT,
          value: openInterestUSDC || undefined,
          fractionDigits: 0,
          type: OutputType.CompactFiat,
        },
        {
          key: 'fee-earned-stakers',
          labelKey: STRING_KEYS.EARNED_BY_STAKERS,
          tagKey: STRING_KEYS._24H,
          value: feeEarned,
          type: OutputType.CompactFiat,
          chartData: feeEarnedChart,
          linkLabelKey: STRING_KEYS.LEARN_MORE_ARROW,
          link: `${chainTokenLabel}/${TokenRoute.StakingRewards}`,
        },
      ].map(
        ({ key, labelKey, tagKey, value, fractionDigits, type, chartData, link, linkLabelKey }) => (
          <Styled.BillboardContainer key={key}>
            <Styled.BillboardStat>
              <Styled.BillboardTitle>
                <label>{stringGetter({ key: labelKey })}</label>
                <Tag>{stringGetter({ key: tagKey })}</Tag>
              </Styled.BillboardTitle>
              <Styled.Output
                useGrouping
                fractionDigits={fractionDigits}
                type={type}
                value={value}
                withBaseFont
              />
              {link && linkLabelKey ? (
                <Styled.BillboardLink
                  href={link}
                  size={ButtonSize.Small}
                  type={ButtonType.Link}
                  action={ButtonAction.Navigation}
                >
                  {stringGetter({ key: linkLabelKey })}
                </Styled.BillboardLink>
              ) : null}
            </Styled.BillboardStat>
            {chartData ? (
              <Styled.BillboardChart>
                <SparklineChart
                  data={chartData}
                  xAccessor={(datum) => datum.x}
                  yAccessor={(datum) => datum.y}
                  positive={true}
                />
              </Styled.BillboardChart>
            ) : (
              false
            )}
          </Styled.BillboardContainer>
        )
      )}
    </Styled.MarketBillboardsWrapper>
  );
};

const Styled = {
  MarketBillboardsWrapper: styled.div`
    ${layoutMixins.column}

    gap: 1rem;
  `,
  BillboardContainer: styled.div`
    ${layoutMixins.row}
    flex: 1;
    justify-content: space-between;

    background-color: var(--color-layer-3);
    padding: 1.5rem;
    border-radius: 0.625rem;
  `,
  BillboardChart: styled.div`
    width: 130px;
    height: 40px;
  `,
  BillboardLink: styled(Button)`
    --button-textColor: var(--color-accent);
    --button-height: unset;
    --button-padding: 0;
    justify-content: flex-start;
  `,
  BillboardTitle: styled.div`
    ${layoutMixins.row}

    gap: 0.375rem;
  `,
  BillboardStat: styled.div`
    ${layoutMixins.column}

    gap: 0.5rem;

    label {
      color: var(--color-text-0);
      font: var(--font-base-medium);
    }

    output {
      color: var(--color-text-1);
      font: var(--font-large-medium);
    }
  `,
  Output: styled(Output)`
    font: var(--font-extra-book);
    color: var(--color-text-2);

    @media ${breakpoints.tablet} {
      font: var(--font-base-book);
    }
  `,
};
