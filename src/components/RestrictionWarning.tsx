import styled from 'styled-components';

import { ComplianceBanner } from './ComplianceBanner';

export const RestrictionWarning = () => {
  return <$RestrictedWarning />;
};

const $RestrictedWarning = styled(ComplianceBanner)`
  /* TEMPORARY: Removed sticky behavior */
  position: static !important; /* Force non-sticky */
  height: var(--restriction-warning-currentHeight);
`;
