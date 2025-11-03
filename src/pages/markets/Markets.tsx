import { useRef, useState } from 'react';

import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { Switch } from '@/components/Switch';
import { MarketsStats } from '@/views/MarketsStats';
import { MarketsTable } from '@/views/tables/MarketsTable';

import { MarketsBanners } from './MarketsBanners';

const Markets = () => {
  const stringGetter = useStringGetter();
  const [showHighlights, setShowHighlights] = useState(true);
  useDocumentTitle(stringGetter({ key: STRING_KEYS.MARKETS }));

  const marketsTableRef = useRef<HTMLDivElement>(null);

  return (
    <$Page>
      <$HeaderSection>
        <MarketsBanners marketsTableRef={marketsTableRef} />
        <$Highlights htmlFor="highlights">
          {stringGetter({ key: STRING_KEYS.HIDE })}

          <Switch name="highlights" checked={showHighlights} onCheckedChange={setShowHighlights} />
        </$Highlights>

        <$MarketsStats showHighlights={showHighlights} />
      </$HeaderSection>

      <$MarketsTable ref={marketsTableRef} />
    </$Page>
  );
};

const $Page = styled.div`
  ${layoutMixins.contentContainerPage}
`;

const $HeaderSection = styled.section`
  ${layoutMixins.contentSectionDetached}

  margin: 1.5rem 0;

  @media ${breakpoints.tablet} {
    ${layoutMixins.flexColumn}
    gap: 1rem;

    margin: 1rem 0;
  }
`;

const $MarketsTable = styled(MarketsTable)`
  ${layoutMixins.contentSectionAttached}
`;

const $MarketsStats = styled(MarketsStats)<{
  showHighlights?: boolean;
}>`
  ${({ showHighlights }) => !showHighlights && 'display: none;'}
`;

const $Highlights = styled.label`
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
