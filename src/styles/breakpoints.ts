import { BREAKPOINT_REM } from '@/constants/page';

export default {
  mobile: `(max-width: ${BREAKPOINT_REM.mobile})`,
  notMobile: `(min-width: ${BREAKPOINT_REM.mobile})`,
  tablet: `(max-width: ${BREAKPOINT_REM.tablet})`,
  notTablet: `(min-width: ${BREAKPOINT_REM.tablet})`,
  desktopSmall: `(max-width: ${BREAKPOINT_REM.desktopSmall})`,
  desktopMedium: `(min-width: ${BREAKPOINT_REM.desktopMedium})`,
  desktopLarge: `(min-width: ${BREAKPOINT_REM.desktopLarge})`,
};
