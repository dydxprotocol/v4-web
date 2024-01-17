import styled, { AnyStyledComponent } from 'styled-components';

import { breakpoints } from '@/styles';

import { STRING_KEYS } from '@/constants/localization';

import { useBreakpoints, useDocumentTitle, useStringGetter } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';

import { ContentSectionHeader } from '@/components/ContentSectionHeader';

import { NewMarketForm } from '@/views/forms/NewMarketForm';

const NewMarket = () => {
  const stringGetter = useStringGetter();
  const { isNotTablet } = useBreakpoints();

  useDocumentTitle(stringGetter({ key: STRING_KEYS.MARKETS }));

  return (
    <Styled.Page>
      <Styled.HeaderSection>
        <Styled.ContentSectionHeader
          title="Suggest a new Market"
          subtitle={isNotTablet && 'Add details in order to launch a new market'}
        />
      </Styled.HeaderSection>
      <NewMarketForm />
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

export default NewMarket;
