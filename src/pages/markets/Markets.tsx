import { useNavigate } from 'react-router-dom';
import styled, { AnyStyledComponent } from 'styled-components';

import { ButtonAction } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { AppRoute, MarketsRoute } from '@/constants/routes';

import { useBreakpoints, useDocumentTitle, useStringGetter } from '@/hooks';
import { usePotentialMarkets } from '@/hooks/usePotentialMarkets';

import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { ContentSectionHeader } from '@/components/ContentSectionHeader';
import { ExchangeBillboards } from '@/views/ExchangeBillboards';
import { MarketsTable } from '@/views/tables/MarketsTable';

const Markets = () => {
  const stringGetter = useStringGetter();
  const { isNotTablet } = useBreakpoints();
  const navigate = useNavigate();
  const { hasPotentialMarketsData } = usePotentialMarkets();

  useDocumentTitle(stringGetter({ key: STRING_KEYS.MARKETS }));

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
        <Styled.ExchangeBillboards isSearching={false} searchQuery="" />
      </Styled.HeaderSection>

      <Styled.MarketsTable />
    </Styled.Page>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Page = styled.div`
  ${layoutMixins.contentContainerPage}
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

Styled.ExchangeBillboards = styled(ExchangeBillboards)`
  ${layoutMixins.contentSectionDetachedScrollable}
`;

Styled.MarketsTable = styled(MarketsTable)`
  ${layoutMixins.contentSectionAttached}
`;

export default Markets;
