import { useSelector } from 'react-redux';
import { ThemeProvider } from 'styled-components';

import { AppTheme, AppColorMode } from '@/state/configs';
import { getAppTheme, getAppColorMode } from '@/state/configsSelectors';

import { Themes } from '@/styles/themes';

export const AppThemeAndColorModeProvider = ({ ...props }) => {
  return <ThemeProvider theme={useAppThemeAndColorModeContext()} {...props} />;
};

export const useAppThemeAndColorModeContext = () => {
  const theme: AppTheme = useSelector(getAppTheme);
  const colorMode: AppColorMode = useSelector(getAppColorMode);

  return Themes[theme][colorMode];
};
