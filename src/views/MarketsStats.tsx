import styled from 'styled-components';
import tw from 'twin.macro';

import { STRING_KEYS } from '@/constants/localization';
import { MarketFilters, MarketSorting } from '@/constants/markets';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useMarketsData } from '@/hooks/useMarketsData';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { NewTag } from '@/components/Tag';

import { ExchangeBillboards } from './ExchangeBillboards';
import { MarketsCompactTable } from './tables/MarketsCompactTable';

interface MarketsStatsProps {
  className?: string;
}

export const MarketsStats = (props: MarketsStatsProps) => {
  const { className } = props;
  const stringGetter = useStringGetter();

  const { hasResults: hasNewMarkets } = useMarketsData({
    filter: MarketFilters.NEW,
    forceHideUnlaunchedMarkets: true,
  });

  const { isTablet } = useBreakpoints();

  return (
    <section
      className={className}
      tw="grid auto-cols-fr grid-flow-col gap-1 tablet:column desktopSmall:pl-1 desktopSmall:pr-1"
    >
      {!isTablet && <ExchangeBillboards />}
      {hasNewMarkets && (
        <$Section>
          <$SectionHeader>
            <h4 tw="flex items-center gap-0.25">
              {stringGetter({ key: STRING_KEYS.RECENTLY_LISTED })}
              <NewTag>{stringGetter({ key: STRING_KEYS.NEW })}</NewTag>
            </h4>
          </$SectionHeader>
          <MarketsCompactTable sorting={MarketSorting.RECENTLY_LISTED} />
        </$Section>
      )}
    </section>
  );
};

const $Section = tw.div`grid grid-rows-[auto_1fr] rounded-0.625 bg-color-layer-2`;

const $SectionHeader = styled.div`
  ${layoutMixins.row}
  position: relative;

  padding: 1.25rem;
  gap: 0.25rem;

  & h4 {
    font: var(--font-base-medium);
    color: var(--color-text-2);
  }

  @media ${breakpoints.tablet} {
    padding: 1rem;
  }
`;
