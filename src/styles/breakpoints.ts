import { BREAKPOINT_REM } from '@/constants/page';

export default {
  mobile: `(width <= ${BREAKPOINT_REM.mobile})`,
  notMobile: `(width > ${BREAKPOINT_REM.mobile})`,
  tablet: `(width <= ${BREAKPOINT_REM.tablet})`,
  notTablet: `(width > ${BREAKPOINT_REM.tablet})`,
  desktopSmall: `(max-width: ${BREAKPOINT_REM.desktopSmall})`,
  desktopMedium: `(min-width: ${BREAKPOINT_REM.desktopMedium})`,
  desktopLarge: `(min-width: ${BREAKPOINT_REM.desktopLarge})`,
};
