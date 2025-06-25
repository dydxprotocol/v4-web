import styled from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { ComplianceBanner } from './ComplianceBanner';

export const RestrictionWarning = () => {
  return <$RestrictedWarning />;
};

const $RestrictedWarning = styled(ComplianceBanner)`
  ${layoutMixins.sticky}
  --stickyArea-totalInsetTop: var(--page-currentHeaderHeight);
  height: var(--restriction-warning-currentHeight);
`;
