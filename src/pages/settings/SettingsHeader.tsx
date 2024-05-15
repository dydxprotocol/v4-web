import styled, { type AnyStyledComponent } from 'styled-components';

import { STRING_KEYS, type StringGetterFunction } from '@/constants/localization';
import { AppRoute, MobileSettingsRoute } from '@/constants/routes';

import { layoutMixins } from '@/styles/layoutMixins';

import { BackButton } from '@/components/BackButton';

export const SettingsHeader = ({
  pathname,
  stringGetter,
}: {
  pathname: string;
  stringGetter: StringGetterFunction;
}) => {
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
      value: `${AppRoute.Settings}/${MobileSettingsRoute.Notifications}`,
      label: stringGetter({ key: STRING_KEYS.NOTIFICATIONS }),
    },
    {
      value: `${AppRoute.Settings}/${MobileSettingsRoute.Network}`,
      label: stringGetter({ key: STRING_KEYS.NETWORK }),
    },
  ];

  const routeMap = Object.fromEntries(
    SettingsRouteItems.map(({ value, label }) => [value, { value, label }])
  );

  const currentRoute = routeMap[pathname];

  return (
    <$SettingsHeader>
      <BackButton />
      <$Label>{currentRoute?.label}</$Label>
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

const $Label = styled.h1`
  padding: 0.5rem;
  font: var(--font-extra-medium);
`;
