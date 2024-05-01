import { useState } from 'react';

import { useNavigate } from 'react-router-dom';
import styled, { AnyStyledComponent } from 'styled-components';

import { ButtonAction } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { AppRoute, MarketsRoute } from '@/constants/routes';

import { useDocumentTitle, useStringGetter } from '@/hooks';
import { usePotentialMarkets } from '@/hooks/usePotentialMarkets';

import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { ContentSectionHeader } from '@/components/ContentSectionHeader';
import { Switch } from '@/components/Switch';
import { MarketsStats } from '@/views/MarketsStats';
import { MarketsTable } from '@/views/tables/MarketsTable';

const Markets = () => {
  const stringGetter = useStringGetter();
  const navigate = useNavigate();
  const [showHighlights, setShowHighlights] = useState(true);
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
        <Styled.Highlights htmlFor="highlights">
          {stringGetter({ key: STRING_KEYS.HIDE })}

          <Switch name="highlights" checked={showHighlights} onCheckedChange={setShowHighlights} />
        </Styled.Highlights>

        <Styled.MarketsStats showHighlights={showHighlights} />
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
    padding: 1.25rem 1.5rem 0;

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

Styled.MarketsTable = styled(MarketsTable)`
  ${layoutMixins.contentSectionAttached}
`;

Styled.MarketsStats = styled(MarketsStats)<{
  showHighlights?: boolean;
}>`
  ${({ showHighlights }) => !showHighlights && 'display: none;'}
`;

Styled.Highlights = styled.label`
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
  display: none;
  cursor: pointer;

  @media ${breakpoints.desktopSmall} {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  @media ${breakpoints.tablet} {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
    margin-bottom: 0;
    display: flex;
  }
`;

export default Markets;
