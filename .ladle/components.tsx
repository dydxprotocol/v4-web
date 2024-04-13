import '@/polyfills';

import { useEffect, useState } from 'react';

import '@/index.css';
import { QueryClient } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import styled from 'styled-components';

import { SupportedLocales } from '@/constants/localization';
import { isDev } from '@/constants/networks';
import { DYDX_MAINNET_CHAIN_INFO, DYDX_TESTNET_CHAIN_INFO } from '@/constants/wallets';

import { AppThemeAndColorModeProvider } from '@/hooks/useAppThemeAndColorMode';
import { LocaleProvider } from '@/hooks/useLocaleSeparators';

import { GlobalStyle } from '@/styles/globalStyle';

import { SelectItem, SelectMenu } from '@/components/SelectMenu';

import { store } from '@/state/_store';
import {
  AppColorMode,
  AppTheme,
  AppThemeSystemSetting,
  setAppColorMode,
  setAppThemeSetting,
} from '@/state/configs';
import { setLocaleLoaded, setSelectedLocale } from '@/state/localization';

import './ladle.css';

const queryClient = new QueryClient();

const wrapProvider = (Component: React.ComponentType<any>, props?: any) => {
  // eslint-disable-next-line react/display-name
  return ({ children }: { children: React.ReactNode }) => (
    <Component {...props}>{children}</Component>
  );
};

const providers = [wrapProvider(LocaleProvider), wrapProvider(AppThemeAndColorModeProvider)];

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
