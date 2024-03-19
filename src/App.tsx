import { lazy, Suspense, useMemo } from 'react';

import { PrivyProvider } from '@privy-io/react-auth';
import { PrivyWagmiConnector } from '@privy-io/wagmi-connector';
import { GrazProvider } from 'graz';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import styled, { AnyStyledComponent, css } from 'styled-components';
import { WagmiConfig } from 'wagmi';

import { AppRoute, DEFAULT_TRADE_ROUTE, MarketsRoute } from '@/constants/routes';

import {
  useBreakpoints,
  useTokenConfigs,
  useInitializePage,
  useShouldShowFooter,
  useAnalytics,
} from '@/hooks';
import { AccountsProvider } from '@/hooks/useAccounts';
import { AppThemeAndColorModeProvider } from '@/hooks/useAppThemeAndColorMode';
import { DialogAreaProvider, useDialogArea } from '@/hooks/useDialogArea';
import { DydxProvider } from '@/hooks/useDydxClient';
import { LocalNotificationsProvider } from '@/hooks/useLocalNotifications';
import { LocaleProvider } from '@/hooks/useLocaleSeparators';
import { NotificationsProvider } from '@/hooks/useNotifications';
import { PotentialMarketsProvider } from '@/hooks/usePotentialMarkets';
import { RestrictionProvider } from '@/hooks/useRestrictions';
import { SubaccountProvider } from '@/hooks/useSubaccount';

import { breakpoints } from '@/styles';
import '@/styles/constants.css';
import '@/styles/fonts.css';
import { GlobalStyle } from '@/styles/globalStyle';
import { layoutMixins } from '@/styles/layoutMixins';
import '@/styles/web3modal.css';

import { GuardedMobileRoute } from '@/components/GuardedMobileRoute';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { DialogManager } from '@/layout/DialogManager';
import { FooterDesktop } from '@/layout/Footer/FooterDesktop';
import { FooterMobile } from '@/layout/Footer/FooterMobile';
import { HeaderDesktop } from '@/layout/Header/HeaderDesktop';
import { NotificationsToastArea } from '@/layout/NotificationsToastArea';
import { GlobalCommandDialog } from '@/views/dialogs/GlobalCommandDialog';

import { parseLocationHash } from '@/lib/urlUtils';
import { config, configureChainsConfig, privyConfig } from '@/lib/wagmi';

const NewMarket = lazy(() => import('@/pages/markets/NewMarket'));
const MarketsPage = lazy(() => import('@/pages/markets/Markets'));
const PortfolioPage = lazy(() => import('@/pages/portfolio/Portfolio'));
const AlertsPage = lazy(() => import('@/pages/AlertsPage'));
const ProfilePage = lazy(() => import('@/pages/Profile'));
const SettingsPage = lazy(() => import('@/pages/settings/Settings'));
const TradePage = lazy(() => import('@/pages/trade/Trade'));
const TermsOfUsePage = lazy(() => import('@/pages/TermsOfUsePage'));
const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPolicyPage'));
const TokenPage = lazy(() => import('@/pages/token/Token'));

const queryClient = new QueryClient();

const Content = () => {
  const { setDialogArea } = useDialogArea();

  useInitializePage();
  useAnalytics();

  const { isTablet, isNotTablet } = useBreakpoints();
  const isShowingHeader = isNotTablet;
  const isShowingFooter = useShouldShowFooter();
  const { chainTokenLabel } = useTokenConfigs();
  const location = useLocation();

  const pathFromHash = useMemo(() => {
    if (location.hash === '') {
      return '';
    }
    return parseLocationHash(location.hash);
  }, [location.hash]);

  return (
    <>
      <GlobalStyle />
      <Styled.Content isShowingHeader={isShowingHeader} isShowingFooter={isShowingFooter}>
        {isNotTablet && <HeaderDesktop />}

        <Styled.Main>
          <Suspense fallback={<LoadingSpace id="main" />}>
            <Routes>
              <Route path={AppRoute.Trade}>
                <Route path=":market" element={<TradePage />} />
                <Route path={AppRoute.Trade} element={<TradePage />} />
              </Route>

              <Route path={AppRoute.Markets}>
                <Route path={MarketsRoute.New} element={<NewMarket />} />
                <Route path={AppRoute.Markets} element={<MarketsPage />} />
              </Route>
              <Route path={`/${chainTokenLabel}/*`} element={<TokenPage />} />
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

              <Route path={AppRoute.Terms} element={<TermsOfUsePage />} />
              <Route path={AppRoute.Privacy} element={<PrivacyPolicyPage />} />
              <Route
                path="*"
                element={<Navigate to={pathFromHash || DEFAULT_TRADE_ROUTE} replace />}
              />
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
    </>
  );
};

const App = () => (
  <AppThemeAndColorModeProvider>
    <PotentialMarketsProvider>
      <DialogAreaProvider>
        <NotificationsProvider>
          <LocalNotificationsProvider>
            <SubaccountProvider>
              <AccountsProvider>
                <DydxProvider>
                  <RestrictionProvider>
                    <LocaleProvider>
                      <WagmiConfig config={config}>
                        <PrivyWagmiConnector wagmiChainsConfig={configureChainsConfig}>
                          <GrazProvider>
                            <QueryClientProvider client={queryClient}>
                              <PrivyProvider
                                appId={import.meta.env.VITE_PRIVY_APP_ID}
                                config={privyConfig}
                              >
                                <Content />
                              </PrivyProvider>
                            </QueryClientProvider>
                          </GrazProvider>
                        </PrivyWagmiConnector>
                      </WagmiConfig>
                    </LocaleProvider>
                  </RestrictionProvider>
                </DydxProvider>
              </AccountsProvider>
            </SubaccountProvider>
          </LocalNotificationsProvider>
        </NotificationsProvider>
      </DialogAreaProvider>
    </PotentialMarketsProvider>
  </AppThemeAndColorModeProvider>
);
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
  box-shadow: none;

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
  height: 100%;
  z-index: 1;
  inset: 0;
  overflow: clip;
  ${layoutMixins.noPointerEvents}
`;

export default App;
