import '@/polyfills';
import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import styled from 'styled-components';

import { store } from '@/state/_store';

import { GlobalStyle } from '@/styles/globalStyle';

import { SelectMenu, SelectItem } from '@/components/SelectMenu';

import { AppThemeAndColorModeProvider } from '@/hooks/useAppThemeAndColorMode';

import {
  AppTheme,
  AppThemeSystemSetting,
  AppColorMode,
  setAppThemeSetting,
  setAppColorMode,
} from '@/state/configs';
import { setLocaleLoaded } from '@/state/localization';

import '@/index.css';
import './ladle.css';

export const StoryWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState(AppTheme.Classic);
  const [colorMode, setColorMode] = useState(AppColorMode.GreenUp);

  useEffect(() => {
    store.dispatch(setAppThemeSetting(theme));
    store.dispatch(setAppColorMode(colorMode));
  }, [theme, colorMode]);

  useEffect(() => {
    store.dispatch(setLocaleLoaded(true));
  }, []);

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
      <AppThemeAndColorModeProvider>
        <GlobalStyle />
        <StoryContent>{children}</StoryContent>
      </AppThemeAndColorModeProvider>
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
