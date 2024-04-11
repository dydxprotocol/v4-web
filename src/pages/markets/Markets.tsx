import { useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled, { AnyStyledComponent } from 'styled-components';

import { ButtonAction, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { MarketFilters, MarketSorting } from '@/constants/markets';
import { AppRoute, MarketsRoute } from '@/constants/routes';

import { useDocumentTitle, useStringGetter } from '@/hooks';
import { usePotentialMarkets } from '@/hooks/usePotentialMarkets';

import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { ContentSectionHeader } from '@/components/ContentSectionHeader';
import { Tag } from '@/components/Tag';
import { ToggleGroup } from '@/components/ToggleGroup';
import { ExchangeBillboards } from '@/views/ExchangeBillboards';
import { MarketsCompactTable } from '@/views/tables/MarketsCompactTable';
import { MarketsTable } from '@/views/tables/MarketsTable';

import { setMarketFilter } from '@/state/perpetuals';
import { getMarketFilter } from '@/state/perpetualsSelectors';

const Markets = () => {
  const stringGetter = useStringGetter();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const filter: MarketFilters = useSelector(getMarketFilter);
  const { hasPotentialMarketsData } = usePotentialMarkets();
  const [sorting, setSorting] = useState(MarketSorting.GAINERS);

  useDocumentTitle(stringGetter({ key: STRING_KEYS.MARKETS }));

  const setNewFilter = () => {
    dispatch(setMarketFilter(MarketFilters.NEW));
  };

  return (
    <Styled.Page>
      <Styled.HeaderSection>
        <Styled.ContentSectionHeader
          title={stringGetter({ key: STRING_KEYS.MARKETS })}
          slotRight={
            hasPotentialMarketsData && (
              <Button
                action={ButtonAction.Primary}
                onClick={() => navigate(`${AppRoute.Markets}/${MarketsRoute.New}`)}
              >
                {stringGetter({ key: STRING_KEYS.ADD_A_MARKET })}
              </Button>
            )
          }
        />
        <Styled.StatsSection>
          <Styled.ExchangeBillboards />
          <Styled.MarketsStats>
            <Styled.MarketsStatsHeader>
              <h4>Recently Listed</h4>
              <Styled.NewTag>{stringGetter({ key: STRING_KEYS.NEW })}</Styled.NewTag>

              <Styled.ViewAll
                type={ButtonType.Link}
                action={ButtonAction.Navigation}
                onClick={setNewFilter}
              >
                View all →
              </Styled.ViewAll>
            </Styled.MarketsStatsHeader>
            <MarketsCompactTable filters={MarketFilters.NEW} />
          </Styled.MarketsStats>
          <Styled.MarketsStats>
            <Styled.MarketsStatsHeader>
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
            </Styled.MarketsStatsHeader>
            <MarketsCompactTable sorting={sorting} />
          </Styled.MarketsStats>
        </Styled.StatsSection>
      </Styled.HeaderSection>

      <Styled.MarketsTable />
    </Styled.Page>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Page = styled.div`
  ${layoutMixins.contentContainerPage}
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

Styled.MarketsStatsHeader = styled.div`
  ${layoutMixins.row}

  justify-content: space-between;
  padding: 1.125rem 1.5rem;
  gap: 0.375rem;

  & h4 {
    font: var(--font-base-medium);
    color: var(--color-text-2);
  }
`;

Styled.ContentSectionHeader = styled(ContentSectionHeader)`
  margin-top: 1rem;
  margin-bottom: 0.25rem;

  h3 {
    font: var(--font-extra-medium);
  }

  @media ${breakpoints.tablet} {
    margin-top: 0;
    padding: 1.25rem 1.875rem 0;

    h3 {
      font: var(--font-extra-medium);
    }
  }
`;

Styled.HeaderSection = styled.section`
  ${layoutMixins.contentSectionDetached}

  margin-bottom: 2rem;

  @media ${breakpoints.tablet} {
    ${layoutMixins.flexColumn}
    gap: 1rem;

    margin-bottom: 1rem;
  }
`;

Styled.StatsSection = styled.section`
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

Styled.MarketsStats = styled.div`
  background: var(--color-layer-3);
  border-radius: 0.625rem;
`;

Styled.ExchangeBillboards = styled(ExchangeBillboards)`
  ${layoutMixins.contentSectionDetachedScrollable}
`;

Styled.MarketsTable = styled(MarketsTable)`
  ${layoutMixins.contentSectionAttached}
`;

export default Markets;
