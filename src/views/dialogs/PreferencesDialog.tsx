import { useEffect, useMemo, useState } from 'react';

import { SelectedGasDenom } from '@dydxprotocol/v4-client-js';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { NotificationCategoryPreferences } from '@/constants/notifications';

import { useDydxClient } from '@/hooks/useDydxClient';
import { useNotifications } from '@/hooks/useNotifications';
import { useStringGetter } from '@/hooks/useStringGetter';

import { ComboboxDialogMenu } from '@/components/ComboboxDialogMenu';
import { Switch } from '@/components/Switch';

import { OtherPreference, setDefaultToAllMarketsInPositionsOrdersFills } from '@/state/configs';
import { getDefaultToAllMarketsInPositionsOrdersFills } from '@/state/configsSelectors';

import { isTruthy } from '@/lib/isTruthy';

const usePreferenceMenu = () => {
  const dispatch = useDispatch();
  const stringGetter = useStringGetter();

  // Notifications
  const { notificationPreferences, setNotificationPreferences } = useNotifications();
  const [enabledNotifs, setEnabledNotifs] = useState(notificationPreferences);

  const currentDisplayAllMarketDefault = useSelector(getDefaultToAllMarketsInPositionsOrdersFills);
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
      group: 'Notifications',
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

  const otherSection = useMemo(
    () => ({
      group: 'Other',
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
      ],
    }),
    [stringGetter, defaultToAllMarkets, selectedGasDenom, setSelectedGasDenom]
  );

  return [notificationSection, otherSection];
};

type ElementProps = {
  setIsOpen: (open: boolean) => void;
};

export const PreferencesDialog = ({ setIsOpen }: ElementProps) => {
  const stringGetter = useStringGetter();
  const preferenceItems = usePreferenceMenu();

  return (
    <$ComboboxDialogMenu
      isOpen
      title={stringGetter({ key: STRING_KEYS.PREFERENCES })}
      items={preferenceItems}
      setIsOpen={setIsOpen}
    />
  );
};
const $ComboboxDialogMenu = styled(ComboboxDialogMenu)`
  --dialog-content-paddingBottom: 0.5rem;
`;
