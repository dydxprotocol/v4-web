import styled, { type AnyStyledComponent } from 'styled-components';

import { StringGetterFunction, STRING_KEYS } from '@/constants/localization';
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
    <Styled.SettingsHeader>
      <BackButton />
      <Styled.Label>{currentRoute?.label}</Styled.Label>
    </Styled.SettingsHeader>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.SettingsHeader = styled.header`
  --stickyArea-topHeight: var(--page-header-height-mobile);

  ${layoutMixins.stickyHeader}
  ${layoutMixins.withOuterBorder}
  ${layoutMixins.row}

  padding: 0 1rem;
  background-color: var(--color-layer-2);
`;

Styled.Label = styled.h1`
  padding: 0.5rem;
  font: var(--font-extra-medium);
`;
