import styled from 'styled-components';

import { STRING_KEYS, type StringGetterFunction } from '@/constants/localization';
import { AppRoute, MobileSettingsRoute } from '@/constants/routes';

import { useSimpleUiEnabled } from '@/hooks/useSimpleUiEnabled';

import { layoutMixins } from '@/styles/layoutMixins';

import { BackButton } from '@/components/BackButton';
import { SimpleUiHeader } from '@/components/SimpleUiHeader';

export const SettingsHeader = ({
  pathname,
  stringGetter,
}: {
  pathname: string;
  stringGetter: StringGetterFunction;
}) => {
  const isSimpleUi = useSimpleUiEnabled();

  const SettingsRouteItems = [
    {
      value: AppRoute.Settings,
      label: stringGetter({ key: STRING_KEYS.SETTINGS }),
    },
    {
      value: `${AppRoute.Settings}/${MobileSettingsRoute.Language}`,
      label: stringGetter({ key: STRING_KEYS.LANGUAGE }),
    },
    {
      value: `${AppRoute.Settings}/${MobileSettingsRoute.Network}`,
      label: stringGetter({ key: STRING_KEYS.NETWORK }),
    },
    {
      value: `${AppRoute.Settings}/${MobileSettingsRoute.Preferences}`,
      label: stringGetter({ key: STRING_KEYS.PREFERENCES }),
    },
    {
      value: `${AppRoute.Settings}/${MobileSettingsRoute.Display}`,
      label: stringGetter({ key: STRING_KEYS.DISPLAY_SETTINGS }),
    },
  ];

  const routeMap = Object.fromEntries(
    SettingsRouteItems.map(({ value, label }) => [value, { value, label }])
  );

  const currentRoute = routeMap[pathname];

  return isSimpleUi ? (
    <SimpleUiHeader pageTitle={currentRoute?.label} />
  ) : (
    <$SettingsHeader>
      <BackButton />
      <h1 tw="p-0.5 font-extra-medium">{currentRoute?.label}</h1>
    </$SettingsHeader>
  );
};
const $SettingsHeader = styled.header`
  --stickyArea-topHeight: var(--page-header-height-mobile);

  ${layoutMixins.stickyHeader}
  ${layoutMixins.withOuterBorder}
  ${layoutMixins.row}

  padding: 0 1rem;
  background-color: var(--color-layer-2);
`;
