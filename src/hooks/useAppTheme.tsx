import { useSelector } from 'react-redux';
import { ThemeProvider } from 'styled-components';

import { AppTheme } from '@/state/configs';
import { getAppTheme } from '@/state/configsSelectors';

import { Themes } from '@/styles/themes';

export const AppThemeProvider = ({ ...props }) => {
    return <ThemeProvider theme={useAppThemeContext()} {...props} />
};

export const useAppThemeContext = () => {
    const theme: AppTheme = useSelector(getAppTheme);
    return Themes[theme];
}
