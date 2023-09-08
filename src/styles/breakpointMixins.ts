import styled, { css, type FlattenSimpleInterpolation } from 'styled-components';

import breakpoints from './breakpoints';

export const breakpointMixins = {
  mobileOnly: css`
    @media ${breakpoints.notMobile} {
      display: none !important;
    }
  `,
  notMobileOnly: css`
    @media ${breakpoints.mobile} {
      display: none !important;
    }
  `,
  tabletOnly: css`
    @media ${breakpoints.notTablet} {
      display: none !important;
    }
  `,
  notTabletOnly: css`
    @media ${breakpoints.tablet} {
      display: none !important;
    }
  `,
};
