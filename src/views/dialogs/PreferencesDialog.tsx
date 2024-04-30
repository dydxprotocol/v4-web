import { useEffect, useMemo, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import styled, { AnyStyledComponent } from 'styled-components';

import { STRING_KEYS, StringKey } from '@/constants/localization';
import { NotificationType } from '@/constants/notifications';

import { useEnvFeatures, useStringGetter } from '@/hooks';
import { useNotifications } from '@/hooks/useNotifications';

import { ComboboxDialogMenu } from '@/components/ComboboxDialogMenu';
import { Switch } from '@/components/Switch';

import { OtherPreference, setDefaultToAllMarketsInPositionsOrdersFills } from '@/state/configs';
import { getDefaultToAllMarketsInPositionsOrdersFills } from '@/state/configsSelectors';

import { isTruthy } from '@/lib/isTruthy';

export const usePreferenceMenu = () => {
  const dispatch = useDispatch();
  const stringGetter = useStringGetter();
  const { isSlTpEnabled } = useEnvFeatures();

  // Notifications
  const { notificationPreferences, setNotificationPreferences } = useNotifications();
  const [enabledNotifs, setEnabledNotifs] = useState(notificationPreferences);

  const currentDisplayAllMarketDefault = useSelector(getDefaultToAllMarketsInPositionsOrdersFills);
  const [defaultToAllMarkets, setDefaultToAllMarkets] = useState(currentDisplayAllMarketDefault);

  const toggleNotifPreference = (type: NotificationType) =>
    setEnabledNotifs((prev) => ({ ...prev, [type]: !prev[type] }));

  useEffect(() => {
    setNotificationPreferences(enabledNotifs);
  }, [enabledNotifs]);

  useEffect(() => {
    setDefaultToAllMarkets(currentDisplayAllMarketDefault);
  }, [currentDisplayAllMarketDefault]);

  const getItem = (notificationType: NotificationType, labelStringKey: StringKey) => ({
    value: notificationType,
    label: stringGetter({ key: labelStringKey }),
    slotAfter: (
      <Switch
        name={notificationType}
        checked={enabledNotifs[notificationType]}
        onCheckedChange={(enabled: boolean) => null}
      />
    ),
    onSelect: () => toggleNotifPreference(notificationType),
  });

  const notificationSection = useMemo(
    () => ({
      group: 'Notifications',
      groupLabel: stringGetter({ key: STRING_KEYS.NOTIFICATIONS }),
      items: [
        {
          value: NotificationType.AbacusGenerated,
          labelStringKey: STRING_KEYS.TRADING,
        },
        {
          value: NotificationType.OrderStatus,
          labelStringKey: STRING_KEYS.ORDER_STATUS,
        },
        {
          value: NotificationType.SquidTransfer,
          labelStringKey: STRING_KEYS.TRANSFERS,
        },
        isSlTpEnabled && {
          value: NotificationType.TriggerOrder,
          labelStringKey: STRING_KEYS.TAKE_PROFIT_STOP_LOSS,
        },
        {
          value: NotificationType.ReleaseUpdates,
          labelStringKey: STRING_KEYS.RELEASE_UPDATES,
        },
      ]
        .filter(isTruthy)
        .map(({ value, labelStringKey }) => getItem(value, labelStringKey as StringKey)),
    }),
    [stringGetter, enabledNotifs]
  );

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
      ],
    }),
    [stringGetter, defaultToAllMarkets]
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
    <Styled.ComboboxDialogMenu
      isOpen
      title={stringGetter({ key: STRING_KEYS.PREFERENCES })}
      items={preferenceItems}
      setIsOpen={setIsOpen}
    />
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.ComboboxDialogMenu = styled(ComboboxDialogMenu)`
  --dialog-content-paddingBottom: 0.5rem;
`;
