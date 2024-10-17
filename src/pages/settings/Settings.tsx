import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import {
  STRING_KEYS,
  SUPPORTED_LOCALE_STRING_LABELS,
  SupportedLocales,
} from '@/constants/localization';
import type { MenuItem } from '@/constants/menus';
import { DydxNetwork } from '@/constants/networks';
import { AppRoute, MobileSettingsRoute } from '@/constants/routes';

import { usePreferenceMenu } from '@/hooks/usePreferenceMenu';
import { useSelectedNetwork } from '@/hooks/useSelectedNetwork';
import { useStringGetter } from '@/hooks/useStringGetter';

import { ComboboxMenu } from '@/components/ComboboxMenu';
import { PageMenu } from '@/components/PageMenu';
import { PageMenuItemType } from '@/components/PageMenu/PageMenuItem';
import { useNetworks } from '@/views/menus/useNetworks';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { setSelectedLocale } from '@/state/localization';
import { getSelectedLocale } from '@/state/localizationSelectors';

import { SettingsHeader } from './SettingsHeader';

const SettingsPage = () => {
  const stringGetter = useStringGetter();
  const { pathname } = useLocation();
  const dispatch = useAppDispatch();
  const selectedLocale = useAppSelector(getSelectedLocale);
  const networks = useNetworks();
  const { switchNetwork, selectedNetwork } = useSelectedNetwork();

  const selectedNetworkConfig = networks.find((network) => network.value === selectedNetwork);

  const mainMenuItems = [
    {
      value: 'language-nav-item',
      type: PageMenuItemType.Navigation,
      href: `${AppRoute.Settings}/${MobileSettingsRoute.Language}`,
      label: stringGetter({ key: STRING_KEYS.LANGUAGE }),
      labelRight: SUPPORTED_LOCALE_STRING_LABELS[selectedLocale],
    },
    {
      value: 'network-nav-item',
      type: PageMenuItemType.Navigation,
      href: `${AppRoute.Settings}/${MobileSettingsRoute.Network}`,
      label: stringGetter({ key: STRING_KEYS.NETWORK }),
      labelRight: selectedNetworkConfig && (
        <>
          {selectedNetworkConfig?.slotBefore} <span>{selectedNetworkConfig?.label}</span>
        </>
      ),
    },
    {
      value: 'preferences-nav-item',
      type: PageMenuItemType.Navigation,
      href: `${AppRoute.Settings}/${MobileSettingsRoute.Preferences}`,
      label: stringGetter({ key: STRING_KEYS.PREFERENCES }),
    },
  ];

  const languages = {
    type: PageMenuItemType.RadioGroup,
    value: selectedLocale,
    label: stringGetter({ key: STRING_KEYS.LANGUAGE }),
    onSelect: (locale: string) => {
      dispatch(setSelectedLocale({ locale: locale as SupportedLocales }));
    },
    subitems: Object.values(SupportedLocales).map((locale) => ({
      value: locale as string,
      label: SUPPORTED_LOCALE_STRING_LABELS[locale],
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
    <>
      <SettingsHeader pathname={pathname} stringGetter={stringGetter} />
      <Routes>
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
        <Route path="*" element={<Navigate to="" replace />} />
      </Routes>
    </>
  );
};

export default SettingsPage;
