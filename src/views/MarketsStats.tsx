import { useState } from 'react';

import styled from 'styled-components';
import tw from 'twin.macro';

import { STRING_KEYS } from '@/constants/localization';
import { MarketSorting } from '@/constants/markets';

import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { Tag } from '@/components/Tag';
import { ToggleGroup } from '@/components/ToggleGroup';

import { ExchangeBillboards } from './ExchangeBillboards';
import { MarketsCompactTable } from './tables/MarketsCompactTable';

interface MarketsStatsProps {
  className?: string;
}

export const MarketsStats = (props: MarketsStatsProps) => {
  const { className } = props;
  const stringGetter = useStringGetter();
  const [sorting, setSorting] = useState(MarketSorting.GAINERS);

  return (
    <$MarketsStats className={className}>
      <ExchangeBillboards />
      <$Section>
        <$SectionHeader>
          <h4 tw="flex items-center gap-0.375">
            {stringGetter({ key: STRING_KEYS.RECENTLY_LISTED })}
            <$NewTag>{stringGetter({ key: STRING_KEYS.NEW })}</$NewTag>
          </h4>
        </$SectionHeader>
        <MarketsCompactTable sorting={MarketSorting.HIGHEST_CLOB_PAIR_ID} />
      </$Section>
      <$Section>
        <$SectionHeader>
          <h4>{stringGetter({ key: STRING_KEYS.BIGGEST_MOVERS })}</h4>
          <$NewTag>{stringGetter({ key: STRING_KEYS._24H })}</$NewTag>

          <$ToggleGroupContainer>
            <ToggleGroup
              items={[
                {
                  label: stringGetter({ key: STRING_KEYS.GAINERS }),
                  value: MarketSorting.GAINERS,
                },
                {
                  label: stringGetter({ key: STRING_KEYS.LOSERS }),
                  value: MarketSorting.LOSERS,
                },
              ]}
              value={sorting}
              onValueChange={setSorting}
            />
          </$ToggleGroupContainer>
        </$SectionHeader>
        <MarketsCompactTable sorting={sorting} />
      </$Section>
    </$MarketsStats>
  );
};

const $MarketsStats = styled.section`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;

  @media ${breakpoints.desktopSmall} {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  @media ${breakpoints.tablet} {
    ${layoutMixins.column}
  }
`;
const $Section = tw.div`grid grid-rows-[auto_1fr] rounded-0.625 bg-layer-3`;
const $NewTag = tw(Tag)`bg-accent-faded text-accent `;
const $ToggleGroupContainer = styled.div`
  ${layoutMixins.row}
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 2;

  @media ${breakpoints.tablet} {
    top: 0.8125rem;
  }

  & button {
    --button-toggle-off-backgroundColor: var(--color-layer-3);
    --button-toggle-off-textColor: var(--color-text-1);
    --border-color: var(--color-layer-6);
    --button-height: 1.75rem;
    --button-padding: 0 0.75rem;
    --button-font: var(--font-mini-book);
  }
`;
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
