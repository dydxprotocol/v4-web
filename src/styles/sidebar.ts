import { PAGE_REM } from '@/constants/page';

export const sidebarBreakpoints = {
  sidebarCollapse: `(max-width: calc(${PAGE_REM.maxContentWidth} + ${PAGE_REM.collapsedSidebarWidth}))`,
  sidebarOpen: `(max-width: calc(${PAGE_REM.maxContentWidth} + ${PAGE_REM.sidebarWidth}))`,
};
