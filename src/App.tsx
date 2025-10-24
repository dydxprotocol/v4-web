import { lazy, Suspense, useEffect, useMemo, useRef } from 'react';

import isPropValid from '@emotion/is-prop-valid';
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { QueryClientProvider } from '@tanstack/react-query';
import { TurnkeyProvider } from '@turnkey/sdk-react';
import { GrazProvider } from 'graz';
import { matchPath, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { PersistGate } from 'redux-persist/integration/react';
import styled, { css, StyleSheetManager, WebTarget } from 'styled-components';

import { config as grazConfig } from '@/constants/graz';
import { AppRoute, DEFAULT_TRADE_ROUTE } from '@/constants/routes';

import { AccountsProvider } from '@/hooks/useAccounts';
import { AppThemeAndColorModeProvider } from '@/hooks/useAppThemeAndColorMode';
import { DialogAreaProvider, useDialogArea } from '@/hooks/useDialogArea';
import { DydxProvider } from '@/hooks/useDydxClient';
import { LocaleProvider } from '@/hooks/useLocaleSeparators';
import { NotificationsProvider } from '@/hooks/useNotifications';
import { RestrictionProvider } from '@/hooks/useRestrictions';
import { StatsigProvider, useCustomFlagValue, useStatsigGateValue } from '@/hooks/useStatsig';
import { SubaccountProvider } from '@/hooks/useSubaccount';

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

import { testFlags } from '@/lib/testFlags';
import { parseLocationHash } from '@/lib/urlUtils';
import { config, privyConfig } from '@/lib/wagmi';

import { BonsaiCore } from './bonsai/ontology';
import { ComplianceBanner } from './components/ComplianceBanner';
import { RestrictionWarning } from './components/RestrictionWarning';
import { DialogTypes } from './constants/dialogs';
import { LocalStorageKey } from './constants/localStorage';
import { CustomFlags, StatsigFlags } from './constants/statsig';
import { TURNKEY_CONFIG } from './constants/turnkey';
import { SkipProvider } from './hooks/transfers/skipClient';
import { useAnalytics } from './hooks/useAnalytics';
import { useBreakpoints } from './hooks/useBreakpoints';
import { useCommandMenu } from './hooks/useCommandMenu';
import { useComplianceState } from './hooks/useComplianceState';
import { useInitializePage } from './hooks/useInitializePage';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useReferralCode } from './hooks/useReferralCode';
import { useShouldShowFooter } from './hooks/useShouldShowFooter';
import { useSimpleUiEnabled } from './hooks/useSimpleUiEnabled';
import { useTokenConfigs } from './hooks/useTokenConfigs';
import { useUpdateTransfers } from './hooks/useUpdateTransfers';
import { WalletConnectionProvider } from './hooks/useWalletConnection';
import { isTruthy } from './lib/isTruthy';
import { AffiliatesPage } from './pages/affiliates/AffiliatesPage';
import { TurnkeyAuthProvider } from './providers/TurnkeyAuthProvider';
import { TurnkeyWalletProvider } from './providers/TurnkeyWalletProvider';
import { persistor } from './state/_store';
import { setOnboardedThisSession } from './state/account';
import { setCurrentPath } from './state/app';
import { appQueryClient } from './state/appQueryClient';
import { useAppDispatch, useAppSelector } from './state/appTypes';
import { AppTheme, setAppThemeSetting } from './state/appUiConfigs';
import { getAppThemeSetting } from './state/appUiConfigsSelectors';
import { openDialog } from './state/dialogs';
import { getIsUserMenuOpen } from './state/dialogsSelectors';
import breakpoints from './styles/breakpoints';

const MarketsPage = lazy(() => import('@/pages/markets/Markets'));
const PortfolioPage = lazy(() => import('@/pages/portfolio/Portfolio'));
const AlertsPage = lazy(() => import('@/pages/AlertsPage'));
const ProfilePage = lazy(() => import('@/pages/Profile'));
const SettingsPage = lazy(() => import('@/pages/settings/Settings'));
const TradePage = lazy(() => import('@/pages/trade/Trade'));
const SpotPage = lazy(() => import('@/pages/spot/Spot'));
const TermsOfUsePage = lazy(() => import('@/pages/TermsOfUsePage'));
const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPolicyPage'));
const RewardsPage = lazy(() => import('@/pages/token/RewardsPage'));
const VaultPage = lazy(() => import('@/pages/vaults/VaultPage'));

// Simple UI
const SimpleMarketsPage = lazy(() => import('@/pages/markets/simple-ui/MarketsMobile'));
const SimpleAssetPage = lazy(() => import('@/pages/trade/simple-ui/AssetPage'));

const Content = () => {
  useInitializePage();
  useAnalytics();
  useCommandMenu();
  useUpdateTransfers();
  useReferralCode();
  useUiRefreshMigrations();
  useOpenDepositIfRelevant();

  const { isTablet, isNotTablet } = useBreakpoints();
  const { chainTokenLabel } = useTokenConfigs();

  const location = useLocation();
  const dispatch = useAppDispatch();
  const isShowingHeader = isNotTablet;
  const isShowingFooter = useShouldShowFooter();
  const abDefaultToMarkets = useCustomFlagValue(CustomFlags.abDefaultToMarkets);
  const isSimpleUi = useSimpleUiEnabled();
  const { showComplianceBanner } = useComplianceState();
  const isSimpleUiUserMenuOpen = useAppSelector(getIsUserMenuOpen);

  // Track current path in Redux for conditional polling
  useEffect(() => {
    dispatch(setCurrentPath(location.pathname));
  }, [location.pathname, dispatch]);

  const pathFromHash = useMemo(() => {
    if (location.hash === '') {
      return '';
    }
    return parseLocationHash(location.hash);
  }, [location.hash]);

  const { dialogAreaRef } = useDialogArea() ?? {};

  if (isSimpleUi) {
    const matchMarkets = matchPath(AppRoute.Markets, location.pathname);
    const backgroundColor =
      matchMarkets && isSimpleUiUserMenuOpen ? 'var(--color-layer-1)' : 'transparent';

    return (
      <>
        <GlobalStyle />
        <$SimpleUiContainer
          showRestrictionBanner={showComplianceBanner}
          css={{
            backgroundColor,
          }}
        >
          <ComplianceBanner tw="h-fit min-h-0" />

          <$SimpleUiMain>
            <Suspense fallback={<LoadingSpace id="main" tw="h-full w-full" />}>
              <Routes>
                <Route path={AppRoute.Markets} element={<SimpleMarketsPage />} />

                <Route path={AppRoute.Trade}>
                  <Route path=":market" element={<SimpleAssetPage />} />
                  <Route path={AppRoute.Trade} element={<SimpleAssetPage />} />
                </Route>

                <Route path={AppRoute.Alerts} element={<AlertsPage />} />
                <Route path={`${AppRoute.Portfolio}/*`} element={<PortfolioPage />} />
                <Route path={`${AppRoute.Settings}/*`} element={<SettingsPage />} />

                <Route
                  path={AppRoute.Terms}
                  element={
                    <$ScrollableContent>
                      <TermsOfUsePage />
                    </$ScrollableContent>
                  }
                />
                <Route
                  path={AppRoute.Privacy}
                  element={
                    <$ScrollableContent>
                      <PrivacyPolicyPage />
                    </$ScrollableContent>
                  }
                />
                <Route path="*" element={<Navigate to={AppRoute.Markets} replace />} />
              </Routes>
            </Suspense>
          </$SimpleUiMain>

          <$DialogArea ref={dialogAreaRef}>
            <DialogManager />
          </$DialogArea>
        </$SimpleUiContainer>
      </>
    );
  }

  return (
    <>
      <GlobalStyle />
      <$Content
        isShowingHeader={isShowingHeader}
        isShowingFooter={isShowingFooter}
        showRestrictionWarning={showComplianceBanner}
      >
        {isShowingHeader && <HeaderDesktop />}
        <RestrictionWarning />
        <$Main>
          <Suspense fallback={<LoadingSpace id="main" />}>
            <Routes>
              <Route path={`${AppRoute.Referrals}/*`} element={<AffiliatesPage />} />

              <Route path={AppRoute.Trade}>
                <Route path=":market" element={<TradePage />} />
                <Route path={AppRoute.Trade} element={<TradePage />} />
              </Route>

              {testFlags.spot && <Route path={`${AppRoute.Spot}/:symbol`} element={<SpotPage />} />}

              <Route path={AppRoute.Markets}>
                <Route path={AppRoute.Markets} element={<MarketsPage />} />
              </Route>

              <Route path={`/${chainTokenLabel}/*`} element={<RewardsPage />} />

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

              <Route path={AppRoute.Vault}>
                <Route path={AppRoute.Vault} element={<VaultPage />} />
              </Route>
              <Route path={AppRoute.Terms} element={<TermsOfUsePage />} />
              <Route path={AppRoute.Privacy} element={<PrivacyPolicyPage />} />
              <Route
                path="*"
                element={
                  <Navigate
                    to={
                      pathFromHash || (abDefaultToMarkets ? AppRoute.Markets : DEFAULT_TRADE_ROUTE)
                    }
                    replace
                  />
                }
              />
            </Routes>
          </Suspense>
        </$Main>

        {isTablet ? <FooterMobile /> : <FooterDesktop />}

        <NotificationsToastArea tw="z-[2] [grid-area:Main]" />

        <$DialogArea ref={dialogAreaRef}>
          <DialogManager />
        </$DialogArea>
      </$Content>
    </>
  );
};

function useUiRefreshMigrations() {
  const themeSetting = useAppSelector(getAppThemeSetting);
  const dispatch = useAppDispatch();
  const [seenUiRefresh, setSeenUiRefresh] = useLocalStorage({
    key: LocalStorageKey.HasSeenUiRefresh,
    defaultValue: false,
  });
  useEffect(() => {
    if (!seenUiRefresh) {
      setSeenUiRefresh(true);
      if (themeSetting === AppTheme.Classic) {
        dispatch(setAppThemeSetting(AppTheme.Dark));
      }
    }
  }, [themeSetting, seenUiRefresh, dispatch, setSeenUiRefresh]);
}

function useOpenDepositIfRelevant() {
  const hasOnboarded = useAppSelector((state) => state.account.onboardedThisSession);
  const equity = useAppSelector(BonsaiCore.account.parentSubaccountSummary.data)?.equity.toNumber();
  const dispatch = useAppDispatch();
  const shouldDeposit = useStatsigGateValue(StatsigFlags.abPopupDeposit);
  const opened = useRef(false);

  useEffect(() => {
    if (shouldDeposit && hasOnboarded && !opened.current && equity != null && equity < 1) {
      opened.current = true;
      dispatch(setOnboardedThisSession(true));
      dispatch(openDialog(DialogTypes.Deposit2({})));
    }
  }, [dispatch, equity, hasOnboarded, shouldDeposit]);
}

const wrapProvider = (Component: React.ComponentType<any>, props?: any) => {
  // eslint-disable-next-line react/display-name
  return ({ children }: { children: React.ReactNode }) => (
    <Component {...props}>{children}</Component>
  );
};

const providers = [
  wrapProvider(PrivyProvider, {
    appId: import.meta.env.VITE_PRIVY_APP_ID ?? 'dummyappiddummyappiddummy',
    clientId: import.meta.env.VITE_PRIVY_APP_CLIENT_ID,
    config: privyConfig,
  }),
  wrapProvider(StatsigProvider),
  wrapProvider(QueryClientProvider, { client: appQueryClient }),
  wrapProvider(GrazProvider, { grazOptions: grazConfig }),
  wrapProvider(WagmiProvider, { config, reconnectOnMount: false }),
  wrapProvider(LocaleProvider),
  wrapProvider(RestrictionProvider),
  wrapProvider(TurnkeyProvider, { config: TURNKEY_CONFIG }),
  wrapProvider(DydxProvider),
  wrapProvider(TurnkeyWalletProvider),
  wrapProvider(WalletConnectionProvider),
  wrapProvider(AccountsProvider),
  wrapProvider(TurnkeyAuthProvider),
  wrapProvider(SubaccountProvider),
  wrapProvider(SkipProvider),
  wrapProvider(NotificationsProvider),
  wrapProvider(DialogAreaProvider),
  wrapProvider(StyleSheetManager, { shouldForwardProp }),
  wrapProvider(AppThemeAndColorModeProvider),
].filter(isTruthy);

const App = () => {
  return [...providers].reverse().reduce(
    (children, Provider) => {
      return (
        <Provider>
          <PersistGate loading={<LoadingSpace id="main" />} persistor={persistor}>
            {children}
          </PersistGate>
        </Provider>
      );
    },
    <Content />
  );
};

// This implements the default behavior from styled-components v5
function shouldForwardProp(propName: string, target: WebTarget): boolean {
  if (typeof target === 'string') {
    // For HTML elements, forward the prop if it is a valid HTML attribute
    return isPropValid(propName);
  }
  // For other elements, forward all props
  return true;
}

const $Content = styled.div<{
  isShowingHeader: boolean;
  isShowingFooter: boolean;
  showRestrictionWarning: boolean;
}>`
  /* Computed */
  --page-currentHeaderHeight: 0px;
  --page-currentFooterHeight: 0px;
  --restriction-warning-currentHeight: 0px;

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

  ${({ showRestrictionWarning }) =>
    showRestrictionWarning &&
    css`
      --restriction-warning-currentHeight: var(--restriction-warning-height);

      @media ${breakpoints.tablet} {
        --restriction-warning-currentHeight: var(--restriction-warning-height-mobile);
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

  ${({ showRestrictionWarning, isShowingHeader }) => css`
    grid-template:
      ${isShowingHeader ? css`'Header' var(--page-currentHeaderHeight)` : ''}
      ${showRestrictionWarning
        ? css`'RestrictionWarning' var(--restriction-warning-currentHeight)`
        : ''}
      'Main' minmax(min-content, 1fr)
      'Footer' var(--page-currentFooterHeight)
      / 100%;
  `}

  transition: 0.3s var(--ease-out-expo);
`;

const $Main = styled.main`
  ${layoutMixins.contentSectionAttached}
  box-shadow: none;

  grid-area: Main;

  isolation: isolate;

  position: relative;
`;

const $SimpleUiContainer = styled.div<{ showRestrictionBanner?: boolean }>`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
`;

const $SimpleUiMain = styled.main`
  box-shadow: none;
  position: relative;
  min-height: 0;
  flex: 1;
`;

const $DialogArea = styled.aside`
  position: fixed;
  height: 100%;
  z-index: 3;
  inset: 0;
  overflow: clip;
  ${layoutMixins.noPointerEvents}
`;

const $ScrollableContent = styled.div`
  height: 100%;
  overflow: auto;
`;

export default App;
