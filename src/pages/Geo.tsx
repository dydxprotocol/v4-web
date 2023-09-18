import styled from 'styled-components';

import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';

export const GeoPage = () => <$Page>Blocked</$Page>;

const $Page = styled.div`
  ${layoutMixins.contentContainerPage}
  gap: 1.5rem;

  @media ${breakpoints.tablet} {
    gap: 0.75rem;
  }
`;
