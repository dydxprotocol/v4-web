import styled, { css } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { USD_DECIMALS } from '@/constants/numbers';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { Details } from '@/components/Details';
import { Output, OutputType } from '@/components/Output';
import { VerticalSeparator } from '@/components/Separator';

type ElementProps = {
  showMidMarketPrice?: boolean;
};

enum MarketStats {
  MARKET_CAP = 'MARKET_CAP',
  SPOT_VOLUME_24H = 'SPOT_VOLUME_24H',
}

const defaultMarketStatistics = Object.values(MarketStats);

const DetailsItem = ({ value, stat }: { value: number | null | undefined; stat: MarketStats }) => {
  switch (stat) {
    case MarketStats.MARKET_CAP: {
      return <$Output type={OutputType.Fiat} value={value} fractionDigits={USD_DECIMALS} />;
    }
    case MarketStats.SPOT_VOLUME_24H: {
      return <$Output type={OutputType.Fiat} value={value} fractionDigits={USD_DECIMALS} />;
    }
    default: {
      return <$Output type={OutputType.Text} value={value} />;
    }
  }
};

export const UnlaunchedMarketStatsDetails = ({ showMidMarketPrice = true }: ElementProps) => {
  const stringGetter = useStringGetter();
  const { isTablet } = useBreakpoints();

  // TODO: Replace with un launched market data
  const { marketCap, spotVolume24H } = {
    marketCap: 0,
    spotVolume24H: 0,
  };

  const valueMap = {
    [MarketStats.MARKET_CAP]: marketCap,
    [MarketStats.SPOT_VOLUME_24H]: spotVolume24H,
  };

  const labelMap = {
    [MarketStats.MARKET_CAP]: stringGetter({ key: STRING_KEYS.MARKET_CAP }),
    [MarketStats.SPOT_VOLUME_24H]: stringGetter({ key: STRING_KEYS.SPOT_VOLUME_24H }),
  };

  return (
    <$MarketDetailsItems>
      {showMidMarketPrice && (
        <$MidMarketPrice>
          <Output type={OutputType.Fiat} value={0.232} fractionDigits={3} />
          <VerticalSeparator />
        </$MidMarketPrice>
      )}

      <$Details
        items={defaultMarketStatistics.map((stat) => ({
          key: stat,
          label: labelMap[stat],
          tooltip: stat,
          value: <DetailsItem value={valueMap[stat]} stat={stat} />,
        }))}
        layout={isTablet ? 'grid' : 'rowColumns'}
        withSeparators={!isTablet}
      />
    </$MarketDetailsItems>
  );
};

const $MarketDetailsItems = styled.div`
  @media ${breakpoints.notTablet} {
    ${layoutMixins.scrollArea}
    ${layoutMixins.row}
    isolation: isolate;

    align-items: stretch;
    margin-left: 1px;
  }

  @media ${breakpoints.tablet} {
    border-bottom: solid var(--border-width) var(--color-border);
  }
`;

const $Details = styled(Details)`
  font: var(--font-mini-book);

  @media ${breakpoints.tablet} {
    ${layoutMixins.withOuterAndInnerBorders}

    font: var(--font-small-book);

    > * {
      padding: 0.625rem 1rem;
    }
  }
`;

const $MidMarketPrice = styled.div`
  ${layoutMixins.sticky}
  ${layoutMixins.row}
  font: var(--font-medium-medium);

  background-color: var(--color-layer-2);
  box-shadow: 0.25rem 0 0.75rem var(--color-layer-2);
  padding-left: 1rem;
  gap: 1rem;
`;

const $Output = styled(Output)<{ color?: string }>`
  ${layoutMixins.row}

  ${({ color }) =>
    color &&
    css`
      color: ${color};
    `}
`;
