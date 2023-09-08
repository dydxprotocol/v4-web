import '@/polyfills';
import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import styled from 'styled-components';

import { store } from '@/state/_store';

import { SelectMenu, SelectItem } from '@/components/SelectMenu';

import { setLocaleLoaded } from '@/state/localization';

import '@/index.css';
import './ladle.css';

export const StoryWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState('Default theme');

  useEffect(() => {
    switch (theme) {
      case 'Dark theme': {
        document?.documentElement?.classList.remove('theme-light');
        document?.documentElement?.classList.add('theme-dark');
        break;
      }
      case 'Light theme': {
        document?.documentElement?.classList.remove('theme-dark');
        document?.documentElement?.classList.add('theme-light');
        break;
      }
      default: {
        document?.documentElement?.classList.remove('theme-dark', 'theme-light');
        break;
      }
    }
  }, [theme]);

  useEffect(() => {
    store.dispatch(setLocaleLoaded(true));
  }, []);

  return (
    <Provider store={store}>
      <StoryHeader>
        <h4>Active Theme:</h4>
        <SelectMenu
          value={theme}
          onValueChange={setTheme}
        >
          {[
            {
              value: 'Default theme',
              label: 'Default theme',
            },
            {
              value: 'Dark theme',
              label: 'Dark theme',
            },
            {
              value: 'Light theme',
              label: 'Light theme',
            },
          ].map(({ value, label }) => (
            <SelectItem
              key={value}
              value={value}
              label={label}
            />
          ))}
        </SelectMenu>
      </StoryHeader>
      <hr />
      <StoryContent>{children}</StoryContent>
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
