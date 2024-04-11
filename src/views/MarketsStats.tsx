import { useState } from 'react';

import { useDispatch } from 'react-redux';
import styled, { AnyStyledComponent } from 'styled-components';

import { ButtonAction, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { MarketFilters, MarketSorting } from '@/constants/markets';

import { useStringGetter } from '@/hooks';

import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Tag } from '@/components/Tag';
import { ToggleGroup } from '@/components/ToggleGroup';

import { setMarketFilter } from '@/state/perpetuals';

import { ExchangeBillboards } from './ExchangeBillboards';
import { MarketsCompactTable } from './tables/MarketsCompactTable';

export const MarketsStats = () => {
  const stringGetter = useStringGetter();
  const dispatch = useDispatch();
  const [sorting, setSorting] = useState(MarketSorting.GAINERS);

  const setNewFilter = () => {
    dispatch(setMarketFilter(MarketFilters.NEW));
  };

  return (
    <Styled.MarketsStats>
      <Styled.ExchangeBillboards />
      <Styled.Section>
        <Styled.SectionHeader>
          <h4>Recently Listed</h4>
          <Styled.NewTag>{stringGetter({ key: STRING_KEYS.NEW })}</Styled.NewTag>

          <Styled.ViewAll
            type={ButtonType.Link}
            action={ButtonAction.Navigation}
            onClick={setNewFilter}
          >
            View all →
          </Styled.ViewAll>
        </Styled.SectionHeader>
        <MarketsCompactTable filters={MarketFilters.NEW} />
      </Styled.Section>
      <Styled.Section>
        <Styled.SectionHeader>
          <h4>Biggest Movers</h4>
          <Tag>{stringGetter({ key: STRING_KEYS._24H })}</Tag>

          <Styled.ToggleGroupContainer>
            <ToggleGroup
              items={[
                {
                  label: 'Gainers',
                  value: 'gainers',
                },
                {
                  label: 'Losers',
                  value: 'losers',
                },
              ]}
              value={sorting}
              onValueChange={setSorting}
            />
          </Styled.ToggleGroupContainer>
        </Styled.SectionHeader>
        <MarketsCompactTable sorting={sorting} />
      </Styled.Section>
    </Styled.MarketsStats>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.MarketsStats = styled.section`
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

Styled.Section = styled.div`
  background: var(--color-layer-3);
  border-radius: 0.625rem;
`;

Styled.ViewAll = styled(Button)`
  --button-textColor: var(--color-accent);
  margin-left: auto;
`;

Styled.NewTag = styled(Tag)`
  background-color: var(--color-accent-faded);
  color: var(--color-accent);
  text-transform: uppercase;
`;

Styled.ToggleGroupContainer = styled.div`
  ${layoutMixins.row}
  margin-left: auto;

  & button {
    --button-toggle-off-backgroundColor: var(--color-layer-3);
    --button-toggle-off-textColor: var(--color-text-1);
    --border-color: var(--color-layer-6);
    --button-height: 1.75rem;
    --button-padding: 0 0.75rem;
    --button-font: var(--font-mini-book);
  }
`;

Styled.SectionHeader = styled.div`
  ${layoutMixins.row}

  justify-content: space-between;
  padding: 1.125rem 1.5rem;
  gap: 0.375rem;

  & h4 {
    font: var(--font-base-medium);
    color: var(--color-text-2);
  }
`;

Styled.ExchangeBillboards = styled(ExchangeBillboards)`
  ${layoutMixins.contentSectionDetachedScrollable}
`;
