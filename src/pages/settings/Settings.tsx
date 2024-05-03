import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import {
  STRING_KEYS,
  SUPPORTED_LOCALE_STRING_LABELS,
  SupportedLocales,
} from '@/constants/localization';
import type { MenuItem } from '@/constants/menus';
import { DydxNetwork } from '@/constants/networks';
import { AppRoute, MobileSettingsRoute } from '@/constants/routes';

import { useSelectedNetwork, useStringGetter } from '@/hooks';

import { ComingSoonSpace } from '@/components/ComingSoon';
import { PageMenu } from '@/components/PageMenu';
import { PageMenuItemType } from '@/components/PageMenu/PageMenuItem';
import { useNetworks } from '@/views/menus/useNetworks';

import { setSelectedLocale } from '@/state/localization';
import { getSelectedLocale } from '@/state/localizationSelectors';

import { SettingsHeader } from './SettingsHeader';

const SettingsPage = () => {
  const stringGetter = useStringGetter();
  const { pathname } = useLocation();
  const dispatch = useDispatch();
  const selectedLocale = useSelector(getSelectedLocale);
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
      value: 'notification-nav-item',
      type: PageMenuItemType.Navigation,
      href: `${AppRoute.Settings}/${MobileSettingsRoute.Notifications}`,
      label: stringGetter({ key: STRING_KEYS.NOTIFICATIONS }),
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
          path={MobileSettingsRoute.Notifications}
          element={<ComingSoonSpace />} // <PageMenu group="notifications" items={[]} />
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
