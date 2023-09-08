import styled from 'styled-components';
import { layoutMixins } from '@/styles/layoutMixins';

export const DetachedSection = styled.section`
  ${layoutMixins.contentSectionDetached}
`;

export const DetachedScrollableSection = styled.section`
  ${layoutMixins.contentSectionDetachedScrollable}
`;

export const AttachedExpandingSection = styled.section`
  ${layoutMixins.contentSectionAttached}
  ${layoutMixins.expandingColumnWithHeader}
  gap: var(--border-width);
`;
