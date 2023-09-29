import styled from 'styled-components';

// import { STRING_KEYS } from '@/constants/localization';
// import { useStringGetter } from '@/hooks';
import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';

import { ContentSectionHeader } from '@/components/ContentSectionHeader';

export const GeoPage = () => {
  // const stringGetter = useStringGetter();

  return (
    <$Page>
      <$ContentSectionHeader
        title="dYdX Unavailable"
        // title={stringGetter({ key: STRING_KEYS.REGION_NOT_PERMITTED_TITLE })}
        // subtitle={stringGetter({ key: STRING_KEYS.REGION_NOT_PERMITTED_SUBTITLE })}
      />
    </$Page>
  );
};

const $Page = styled.div`
  ${layoutMixins.contentContainerPage}
  gap: 1.5rem;

  @media ${breakpoints.tablet} {
    gap: 0.75rem;
  }
`;

const $ContentSectionHeader = styled(ContentSectionHeader)`
  @media ${breakpoints.tablet} {
    padding: 1.25rem 1.875rem 0;

    h3 {
      font: var(--font-extra-medium);
    }
  }
`;
