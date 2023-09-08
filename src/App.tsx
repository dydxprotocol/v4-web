import { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import styled, { AnyStyledComponent, css } from 'styled-components';
import { WagmiConfig } from 'wagmi';
import { QueryClient, QueryClientProvider } from 'react-query';
import { GrazProvider } from 'graz';

import { AppRoute, DEFAULT_TRADE_ROUTE } from '@/constants/routes';

import { useBreakpoints, useInitializePage, useShouldShowFooter, useAnalytics } from '@/hooks';
import { DydxProvider } from '@/hooks/useDydxClient';
import { AccountsProvider } from '@/hooks/useAccounts';
import { DialogAreaProvider, useDialogArea } from '@/hooks/useDialogArea';
import { LocaleProvider } from '@/hooks/useLocaleSeparators';
import { NotificationsProvider } from '@/hooks/useNotifications';
import { LocalNotificationsProvider } from '@/hooks/useLocalNotifications';
import { SubaccountProvider } from '@/hooks/useSubaccount';
import { SquidProvider } from '@/hooks/useSquid';

import { GuardedMobileRoute } from '@/components/GuardedMobileRoute';

import MarketsPage from '@/pages/markets/Markets';
import PortfolioPage from '@/pages/portfolio/Portfolio';
import { AlertsPage } from '@/pages/AlertsPage';
import ProfilePage from '@/pages/Profile';
import { SettingsPage } from '@/pages/settings/Settings';
import TradePage from '@/pages/trade/Trade';
import { RewardsPage } from '@/pages/rewards/RewardsPage';

import { HeaderDesktop } from '@/layout/Header/HeaderDesktop';
import { FooterDesktop } from '@/layout/Footer/FooterDesktop';
import { FooterMobile } from '@/layout/Footer/FooterMobile';
import { NotificationsToastArea } from '@/layout/NotificationsToastArea';
import { DialogManager } from '@/layout/DialogManager';
import { GlobalCommandDialog } from '@/views/dialogs/GlobalCommandDialog';

import { config } from '@/lib/wagmi';

import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';

import '@/styles/constants.css';
import '@/styles/fonts.css';
import '@/styles/web3modal.css';

const queryClient = new QueryClient();

const Content = () => {
  const { setDialogArea } = useDialogArea();

  useInitializePage();
  useAnalytics();

  const { isTablet, isNotTablet } = useBreakpoints();
  const isShowingHeader = isNotTablet;
  const isShowingFooter = useShouldShowFooter();

  return (
    <Styled.Content isShowingHeader={isShowingHeader} isShowingFooter={isShowingFooter}>
      {isNotTablet && <HeaderDesktop />}

      <Styled.Main>
        <Suspense fallback={null}>
          <Routes>
            <Route path={AppRoute.Trade}>
              <Route path=":market" element={<TradePage />} />
              <Route path={AppRoute.Trade} element={<TradePage />} />
            </Route>
            <Route path={AppRoute.Markets} element={<MarketsPage />} />
            {import.meta.env.MODE !== 'production' && (
              <Route path={AppRoute.Rewards} element={<RewardsPage />} />
            )}
            {isTablet && (
              <>
                <Route path={AppRoute.Alerts} element={<AlertsPage />} />
                <Route path={AppRoute.Profile} element={<ProfilePage />} />
                <Route path={`${AppRoute.Settings}/*`} element={<SettingsPage />} />
              </>
            )}

            <Route element={<GuardedMobileRoute />}>
              <Route path={`${AppRoute.Portfolio}/*`} element={<PortfolioPage />} />
            </Route>
            <Route path="*" element={<Navigate to={DEFAULT_TRADE_ROUTE} replace />} />
          </Routes>
        </Suspense>
      </Styled.Main>

      {isTablet ? <FooterMobile /> : <FooterDesktop />}

      <Styled.NotificationsToastArea />

      <Styled.DialogArea ref={setDialogArea}>
        <DialogManager />
      </Styled.DialogArea>

      <GlobalCommandDialog />
    </Styled.Content>
  );
};

const wrapProvider = (Component: React.ComponentType<any>, props?: any) => {
  // eslint-disable-next-line react/display-name
  return ({ children }: { children: React.ReactNode }) => (
    <Component {...props}>{children}</Component>
  );
};

const providers = [
  wrapProvider(QueryClientProvider, { client: queryClient }),
  wrapProvider(GrazProvider),
  wrapProvider(WagmiConfig, { config }),
  wrapProvider(LocaleProvider),
  wrapProvider(DydxProvider),
  wrapProvider(AccountsProvider),
  wrapProvider(SubaccountProvider),
  wrapProvider(SquidProvider),
  wrapProvider(LocalNotificationsProvider),
  wrapProvider(NotificationsProvider),
  wrapProvider(DialogAreaProvider),
];

const App = () => {
  return [...providers].reverse().reduce((children, Provider) => {
    return <Provider>{children}</Provider>;
  }, <Content />);
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Content = styled.div<{ isShowingHeader: boolean; isShowingFooter: boolean }>`
  /* Computed */
  --page-currentHeaderHeight: 0px;
  --page-currentFooterHeight: 0px;

  ${({ isShowingHeader }) =>
    isShowingHeader &&
    css`
      --page-currentHeaderHeight: var(--page-header-height);

      @media ${breakpoints.tablet} {
        --page-currentHeaderHeight: var(--page-header-height-mobile);
      }
    `}

  ${({ isShowingFooter }) =>
    isShowingFooter &&
    css`
      --page-currentFooterHeight: var(--page-footer-height);

      @media ${breakpoints.tablet} {
        --page-currentFooterHeight: var(--page-footer-height-mobile);
      }
    `}

  /* Rules */
  ${layoutMixins.contentContainer}

  ${layoutMixins.scrollArea}
  --scrollArea-height: 100vh;

  @supports (-webkit-touch-callout: none) {
    height: -webkit-fill-available;
  }

  ${layoutMixins.stickyArea0}
  --stickyArea0-topHeight: var(--page-currentHeaderHeight);
  --stickyArea0-topGap: var(--border-width);
  --stickyArea0-bottomGap: var(--border-width);
  --stickyArea0-bottomHeight: var(--page-currentFooterHeight);

  ${layoutMixins.withOuterAndInnerBorders}
  display: grid;
  grid-template:
    'Header' var(--page-currentHeaderHeight)
    'Main' minmax(min-content, 1fr)
    'Footer' var(--page-currentFooterHeight)
    / 100%;

  transition: 0.3s var(--ease-out-expo);
`;

Styled.Main = styled.main`
  ${layoutMixins.contentSectionAttached}

  grid-area: Main;

  isolation: isolate;

  position: relative;
`;

Styled.NotificationsToastArea = styled(NotificationsToastArea)`
  grid-area: Main;
  z-index: 2;
`;

Styled.DialogArea = styled.aside`
  position: fixed;
  height: 100vh;
  z-index: 1;
  inset: 0;
  overflow: clip;
  ${layoutMixins.noPointerEvents}
`;

export default App;
