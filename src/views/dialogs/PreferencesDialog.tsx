import { useEffect, useMemo, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import styled, { AnyStyledComponent } from 'styled-components';

import { ComplianceStates } from '@/constants/compliance';
import { STRING_KEYS } from '@/constants/localization';
import { NotificationType } from '@/constants/notifications';

import { useStringGetter } from '@/hooks';
import { useComplianceState } from '@/hooks/useComplianceState';
import { useNotifications } from '@/hooks/useNotifications';

import { ComboboxDialogMenu } from '@/components/ComboboxDialogMenu';
import { Switch } from '@/components/Switch';

import { OtherPreference, setDefaultToAllMarketsInPositionsOrdersFills } from '@/state/configs';
import { getDefaultToAllMarketsInPositionsOrdersFills } from '@/state/configsSelectors';

import { isTruthy } from '@/lib/isTruthy';
import { testFlags } from '@/lib/testFlags';

export const usePreferenceMenu = () => {
  const dispatch = useDispatch();
  const stringGetter = useStringGetter();
  const { complianceState } = useComplianceState();

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

  const notificationSection = useMemo(
    () => ({
      group: 'Notifications',
      groupLabel: stringGetter({ key: STRING_KEYS.NOTIFICATIONS }),
      items: [
        {
          value: NotificationType.AbacusGenerated,
          label: stringGetter({ key: STRING_KEYS.TRADING }),
          slotAfter: (
            <Switch
              name={NotificationType.AbacusGenerated}
              checked={enabledNotifs[NotificationType.AbacusGenerated]}
              onCheckedChange={(enabled: boolean) => null}
            />
          ),
          onSelect: () => toggleNotifPreference(NotificationType.AbacusGenerated),
        },
        {
          value: NotificationType.SquidTransfer,
          label: stringGetter({ key: STRING_KEYS.TRANSFERS }),
          slotAfter: (
            <Switch
              name={NotificationType.SquidTransfer}
              checked={enabledNotifs[NotificationType.SquidTransfer]}
              onCheckedChange={(enabled: boolean) => null}
            />
          ),
          onSelect: () => toggleNotifPreference(NotificationType.SquidTransfer),
        },
        testFlags.configureSlTpFromPositionsTable && {
          value: NotificationType.TriggerOrder,
          label: stringGetter({ key: STRING_KEYS.TAKE_PROFIT_STOP_LOSS }),
          slotAfter: (
            <Switch
              name={NotificationType.TriggerOrder}
              checked={enabledNotifs[NotificationType.TriggerOrder]}
              onCheckedChange={(enabled: boolean) => null}
            />
          ),
          onSelect: () => toggleNotifPreference(NotificationType.TriggerOrder),
        },
        {
          value: NotificationType.ReleaseUpdates,
          label: 'Release Updates',
          slotAfter: (
            <Switch
              name={NotificationType.ReleaseUpdates}
              checked={enabledNotifs[NotificationType.ReleaseUpdates]}
              onCheckedChange={(enabled: boolean) => null}
            />
          ),
          onSelect: () => toggleNotifPreference(NotificationType.ReleaseUpdates),
        },
      ].filter(isTruthy),
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
              onCheckedChange={(enabled: boolean) => null}
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
