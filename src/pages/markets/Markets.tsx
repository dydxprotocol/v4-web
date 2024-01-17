import styled, { AnyStyledComponent } from 'styled-components';
import { useNavigate } from 'react-router-dom';

import { breakpoints } from '@/styles';

import { STRING_KEYS } from '@/constants/localization';

import { useBreakpoints, useDocumentTitle, useStringGetter } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';

import { ContentSectionHeader } from '@/components/ContentSectionHeader';

import { ExchangeBillboards } from '@/views/ExchangeBillboards';
import { MarketsTable } from '@/views/tables/MarketsTable';
import { Button } from '@/components/Button';
import { AppRoute, MarketsRoute } from '@/constants/routes';

const Markets = () => {
  const stringGetter = useStringGetter();
  const { isNotTablet } = useBreakpoints();
  const navigate = useNavigate();

  useDocumentTitle(stringGetter({ key: STRING_KEYS.MARKETS }));

  return (
    <Styled.Page>
      <Styled.HeaderSection>
        <Styled.ContentSectionHeader
          title={stringGetter({ key: STRING_KEYS.MARKETS })}
          subtitle={isNotTablet && stringGetter({ key: STRING_KEYS.DISCOVER_NEW_ASSETS })}
          slotRight={
            <Button onClick={() => navigate(`${AppRoute.Markets}/${MarketsRoute.New}`)}>
              Add a Market
            </Button>
          }
        />
        <Styled.ExchangeBillboards isSearching={false} searchQuery="" />
      </Styled.HeaderSection>

      <Styled.MarketsTable />
    </Styled.Page>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Page = styled.div`
  ${layoutMixins.contentContainerPage}
  gap: 1.5rem;

  @media ${breakpoints.tablet} {
    gap: 0.75rem;
  }
`;

Styled.ContentSectionHeader = styled(ContentSectionHeader)`
  @media ${breakpoints.tablet} {
    padding: 1.25rem 1.875rem 0;

    h3 {
      font: var(--font-extra-medium);
    }
  }
`;

Styled.HeaderSection = styled.section`
  ${layoutMixins.contentSectionDetached}

  @media ${breakpoints.tablet} {
    ${layoutMixins.flexColumn}
    gap: 1rem;

    margin-bottom: 0.5rem;
  }
`;

Styled.ExchangeBillboards = styled(ExchangeBillboards)`
  ${layoutMixins.contentSectionDetachedScrollable}
`;

Styled.MarketsTable = styled(MarketsTable)`
  ${layoutMixins.contentSectionAttached}
`;

export default Markets;
