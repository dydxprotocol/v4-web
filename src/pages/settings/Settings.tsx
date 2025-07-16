import { Outlet, Route, Routes, useLocation } from 'react-router-dom';
import styled from 'styled-components';

import { STRING_KEYS, SUPPORTED_LOCALES, SupportedLocales } from '@/constants/localization';
import type { MenuItem } from '@/constants/menus';
import { DydxNetwork } from '@/constants/networks';
import { AppRoute, MobileSettingsRoute } from '@/constants/routes';

import { usePreferenceMenu } from '@/hooks/usePreferenceMenu';
import { useSelectedNetwork } from '@/hooks/useSelectedNetwork';
import { useSimpleUiEnabled } from '@/hooks/useSimpleUiEnabled';
import { useStringGetter } from '@/hooks/useStringGetter';

import { ComboboxMenu } from '@/components/ComboboxMenu';
import { PageMenu } from '@/components/PageMenu';
import { PageMenuItemType } from '@/components/PageMenu/PageMenuItem';
import { DisplaySettings } from '@/views/DisplaySettings';
import { useNetworks } from '@/views/menus/useNetworks';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { setSelectedLocale } from '@/state/localization';
import { getSelectedLocale } from '@/state/localizationSelectors';

import { SettingsHeader } from './SettingsHeader';

const SettingsPage = () => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();
  const selectedLocale = useAppSelector(getSelectedLocale);
  const networks = useNetworks();
  const { switchNetwork, selectedNetwork } = useSelectedNetwork();
  const isSimpleUi = useSimpleUiEnabled();

  const selectedNetworkConfig = networks.find((network) => network.value === selectedNetwork);

  const mainMenuItems = [
    {
      value: 'language-nav-item',
      type: PageMenuItemType.Navigation,
      href: `${AppRoute.Settings}/${MobileSettingsRoute.Language}`,
      label: stringGetter({ key: STRING_KEYS.LANGUAGE }),
      labelRight: SUPPORTED_LOCALES.find(({ locale }) => locale === selectedLocale)?.label,
    },
    {
      value: 'network-nav-item',
      type: PageMenuItemType.Navigation,
      href: `${AppRoute.Settings}/${MobileSettingsRoute.Network}`,
      label: stringGetter({ key: STRING_KEYS.NETWORK }),
      labelRight: selectedNetworkConfig && (
        <>
          {selectedNetworkConfig.slotBefore} <span>{selectedNetworkConfig.label}</span>
        </>
      ),
    },
    {
      value: 'preferences-nav-item',
      type: PageMenuItemType.Navigation,
      href: `${AppRoute.Settings}/${MobileSettingsRoute.Preferences}`,
      label: stringGetter({ key: STRING_KEYS.PREFERENCES }),
    },
    {
      value: 'display-settings-nav-item',
      type: PageMenuItemType.Navigation,
      href: `${AppRoute.Settings}/${MobileSettingsRoute.Display}`,
      label: stringGetter({ key: STRING_KEYS.DISPLAY_SETTINGS }),
    },
  ];

  const languages = {
    type: PageMenuItemType.RadioGroup,
    value: selectedLocale,
    label: stringGetter({ key: STRING_KEYS.LANGUAGE }),
    onSelect: (locale: string) => {
      dispatch(setSelectedLocale({ locale: locale as SupportedLocales }));
    },
    subitems: SUPPORTED_LOCALES.map(({ locale, label }) => ({
      value: locale as string,
      label,
    })),
  };

  const networkMenuItems = {
    type: PageMenuItemType.RadioGroup,
    value: selectedNetwork,
    label: stringGetter({ key: STRING_KEYS.NETWORK }),
    onSelect: (network: string) => switchNetwork(network as DydxNetwork),
    subitems: networks as MenuItem<DydxNetwork, PageMenuItemType>[],
  };

  const preferencesMenuItems = usePreferenceMenu();

  return (
    <Routes>
      <Route element={<Settings />}>
        <Route path="" element={<PageMenu group="main" items={mainMenuItems} />} />
        <Route
          path={MobileSettingsRoute.Language}
          element={<PageMenu group="language" items={[languages]} />}
        />
        <Route
          path={MobileSettingsRoute.Preferences}
          element={<ComboboxMenu items={preferencesMenuItems} withSearch={false} />}
        />
        <Route
          path={MobileSettingsRoute.Network}
          element={<PageMenu group="network" items={[networkMenuItems]} />}
        />
        <Route
          path={MobileSettingsRoute.Display}
          element={
            <DisplaySettings
              css={{
                padding: isSimpleUi ? '0 1.5rem' : '1rem 1.5rem',
              }}
            />
          }
        />
      </Route>
    </Routes>
  );
};

const Settings = () => {
  const { pathname } = useLocation();
  const stringGetter = useStringGetter();
  return (
    <$SettingsContainer>
      <SettingsHeader pathname={pathname} stringGetter={stringGetter} />
      <div tw="overflow-auto">
        <Outlet />
      </div>
    </$SettingsContainer>
  );
};

const $SettingsContainer = styled.div`
  overflow: hidden;
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100vh;
`;

export default SettingsPage;
