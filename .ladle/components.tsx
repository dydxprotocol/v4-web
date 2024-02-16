import '@/polyfills';
import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import styled from 'styled-components';
import { WagmiConfig } from 'wagmi';
import { GrazProvider } from 'graz';
import { QueryClient, QueryClientProvider } from 'react-query';

import { SupportedLocales } from '@/constants/localization';

import { AccountsProvider } from '@/hooks/useAccounts';
import { AppThemeAndColorModeProvider } from '@/hooks/useAppThemeAndColorMode';
import { DydxProvider } from '@/hooks/useDydxClient';
import { DialogAreaProvider } from '@/hooks/useDialogArea';
import { LocaleProvider } from '@/hooks/useLocaleSeparators';
import { PotentialMarketsProvider } from '@/hooks/usePotentialMarkets';
import { RestrictionProvider } from '@/hooks/useRestrictions';
import { SubaccountProvider } from '@/hooks/useSubaccount';

import { GlobalStyle } from '@/styles/globalStyle';

import { SelectMenu, SelectItem } from '@/components/SelectMenu';

import {
  AppTheme,
  AppThemeSystemSetting,
  AppColorMode,
  setAppThemeSetting,
  setAppColorMode,
} from '@/state/configs';

import { setLocaleLoaded, setSelectedLocale } from '@/state/localization';
import { store } from '@/state/_store';

import { config } from '@/lib/wagmi';

import '@/index.css';
import './ladle.css';

const queryClient = new QueryClient();

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
  wrapProvider(RestrictionProvider),
  wrapProvider(DydxProvider),
  wrapProvider(AccountsProvider),
  wrapProvider(SubaccountProvider),
  wrapProvider(DialogAreaProvider),
  wrapProvider(PotentialMarketsProvider),
  wrapProvider(AppThemeAndColorModeProvider),
];

export const StoryWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState(AppTheme.Classic);
  const [colorMode, setColorMode] = useState(AppColorMode.GreenUp);

  useEffect(() => {
    store.dispatch(setAppThemeSetting(theme));
    store.dispatch(setAppColorMode(colorMode));
  }, [theme, colorMode]);

  useEffect(() => {
    store.dispatch(setSelectedLocale({ locale: SupportedLocales.EN }));
    store.dispatch(setLocaleLoaded(true));
  }, []);

  const content = [...providers].reverse().reduce(
    (children, Provider) => {
      return <Provider>{children}</Provider>;
    },
    <StoryContent>
      <GlobalStyle />
      {children}
    </StoryContent>
  );

  return (
    <Provider store={store}>
      <StoryHeader>
        <h4>Active Theme:</h4>
        <SelectMenu value={theme} onValueChange={setTheme}>
          {[
            {
              value: AppTheme.Classic,
              label: 'Default theme',
            },
            {
              value: AppThemeSystemSetting.System,
              label: 'System theme',
            },
            {
              value: AppTheme.Dark,
              label: 'Dark theme',
            },
            {
              value: AppTheme.Light,
              label: 'Light theme',
            },
          ].map(({ value, label }) => (
            <SelectItem key={value} value={value} label={label} />
          ))}
        </SelectMenu>
        <h4>Active Color Mode:</h4>
        <SelectMenu value={colorMode} onValueChange={setColorMode}>
          {[
            {
              value: AppColorMode.GreenUp,
              label: 'Green up',
            },
            {
              value: AppColorMode.RedUp,
              label: 'Red up',
            },
          ].map(({ value, label }) => (
            <SelectItem key={value} value={value} label={label} />
          ))}
        </SelectMenu>
      </StoryHeader>
      <hr />
      {content}
    </Provider>
  );
};

const StoryHeader = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const StoryContent = styled.div`
  --default-border-width: 1px;
  --border-width: var(--default-border-width);

  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
`;
