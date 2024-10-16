import { useEffect, useMemo, useState } from 'react';

import { SelectedGasDenom } from '@dydxprotocol/v4-client-js';

import { TradeLayouts } from '@/constants/layout';
import { STRING_KEYS } from '@/constants/localization';
import { MenuConfig } from '@/constants/menus';
import { isDev } from '@/constants/networks';
import { NotificationCategoryPreferences } from '@/constants/notifications';

import { useDydxClient } from '@/hooks/useDydxClient';
import { useNotifications } from '@/hooks/useNotifications';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Switch } from '@/components/Switch';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { OtherPreference, setDefaultToAllMarketsInPositionsOrdersFills } from '@/state/configs';
import { getDefaultToAllMarketsInPositionsOrdersFills } from '@/state/configsSelectors';
import { setSelectedTradeLayout } from '@/state/layout';
import { getSelectedTradeLayout } from '@/state/layoutSelectors';

import { isTruthy } from '@/lib/isTruthy';

export const usePreferenceMenu = (): MenuConfig<
  OtherPreference | NotificationCategoryPreferences,
  'Other' | 'Notifications'
> => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();

  // Notifications
  const { notificationPreferences, setNotificationPreferences } = useNotifications();
  const [enabledNotifs, setEnabledNotifs] = useState(notificationPreferences);

  const currentDisplayAllMarketDefault = useAppSelector(
    getDefaultToAllMarketsInPositionsOrdersFills
  );
  const [defaultToAllMarkets, setDefaultToAllMarkets] = useState(currentDisplayAllMarketDefault);

  const toggleNotifPreference = (type: NotificationCategoryPreferences) =>
    setEnabledNotifs((prev) => ({ ...prev, [type]: !prev[type] }));

  useEffect(() => {
    setNotificationPreferences(enabledNotifs);
  }, [enabledNotifs]);

  useEffect(() => {
    setDefaultToAllMarkets(currentDisplayAllMarketDefault);
  }, [currentDisplayAllMarketDefault]);

  const getItem = (
    notificationCategory: NotificationCategoryPreferences,
    labelStringKey: string
  ) => ({
    value: notificationCategory,
    label: stringGetter({ key: labelStringKey }),
    slotAfter: (
      <Switch
        name={notificationCategory}
        checked={enabledNotifs[notificationCategory]}
        onCheckedChange={() => null}
      />
    ),
    onSelect: () => toggleNotifPreference(notificationCategory),
  });

  const notificationSection = useMemo(
    () => ({
      group: 'Notifications' as const,
      groupLabel: stringGetter({ key: STRING_KEYS.NOTIFICATIONS }),
      items: [
        {
          value: NotificationCategoryPreferences.General,
          labelStringKey: STRING_KEYS.GENERAL,
        },
        {
          value: NotificationCategoryPreferences.Transfers,
          labelStringKey: STRING_KEYS.TRANSFERS,
        },
        {
          value: NotificationCategoryPreferences.Trading,
          labelStringKey: STRING_KEYS.TRADING,
        },
      ]
        .filter(isTruthy)
        .map(({ value, labelStringKey }) => getItem(value, labelStringKey)),
    }),
    [stringGetter, enabledNotifs]
  );

  const { setSelectedGasDenom, selectedGasDenom } = useDydxClient();
  const selectedLayout = useAppSelector(getSelectedTradeLayout);

  const otherSection = useMemo(
    () => ({
      group: 'Other' as const,
      groupLabel: stringGetter({ key: STRING_KEYS.OTHER }),
      items: [
        {
          value: OtherPreference.DisplayAllMarketsDefault,
          label: stringGetter({ key: STRING_KEYS.DEFAULT_TO_ALL_MARKETS_IN_POSITIONS }),
          slotAfter: (
            <Switch
              name={OtherPreference.DisplayAllMarketsDefault}
              checked={defaultToAllMarkets}
              onCheckedChange={() => null}
            />
          ),
          onSelect: () => {
            dispatch(setDefaultToAllMarketsInPositionsOrdersFills(!defaultToAllMarkets));
          },
        },
        ...(isDev
          ? [
              {
                value: OtherPreference.GasToken,
                label: 'Pay gas with USDC',
                slotAfter: (
                  <Switch
                    name={OtherPreference.GasToken}
                    checked={selectedGasDenom === SelectedGasDenom.USDC}
                    onCheckedChange={() => null}
                  />
                ),
                onSelect: () => {
                  setSelectedGasDenom(
                    selectedGasDenom === SelectedGasDenom.USDC
                      ? SelectedGasDenom.NATIVE
                      : SelectedGasDenom.USDC
                  );
                },
              },
              {
                value: OtherPreference.ReverseLayout,
                label: 'Reverse Layout',
                slotAfter: (
                  <Switch
                    name={OtherPreference.ReverseLayout}
                    checked={selectedLayout === TradeLayouts.Reverse}
                    onCheckedChange={() => null}
                  />
                ),
                onSelect: () => {
                  dispatch(
                    setSelectedTradeLayout(
                      selectedLayout === TradeLayouts.Reverse
                        ? TradeLayouts.Default
                        : TradeLayouts.Reverse
                    )
                  );
                },
              },
            ]
          : []),
      ].filter(isTruthy),
    }),
    [
      stringGetter,
      defaultToAllMarkets,
      selectedGasDenom,
      setSelectedGasDenom,
      dispatch,
      selectedLayout,
    ]
  );

  return [notificationSection, otherSection];
};
