import { useEffect, useMemo, useState } from 'react';
import styled, { AnyStyledComponent } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { NotificationType } from '@/constants/notifications';

import { useStringGetter } from '@/hooks';
import { useNotifications } from '@/hooks/useNotifications';

import { ComboboxDialogMenu } from '@/components/ComboboxDialogMenu';
import { Switch } from '@/components/Switch';

export const usePreferenceMenu = () => {
  const stringGetter = useStringGetter();

  // Notifications
  const { notificationPreferences, setNotificationPreferences } = useNotifications();
  const [enabledNotifs, setEnabledNotifs] = useState(notificationPreferences);

  const toggleNotifPreference = (type: NotificationType) =>
    setEnabledNotifs((prev) => ({ ...prev, [type]: !prev[type] }));

  useEffect(() => {
    setNotificationPreferences(enabledNotifs);
  }, [enabledNotifs]);

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
        {
          value: NotificationType.ReleaseUpdates,
          label: "Release Updates",
          slotAfter: (
            <Switch
              name={NotificationType.ReleaseUpdates}
              checked={enabledNotifs[NotificationType.ReleaseUpdates]}
              onCheckedChange={(enabled: boolean) => null}
            />
          ),
          onSelect: () => toggleNotifPreference(NotificationType.ReleaseUpdates),
        }
      ],
    }),
    [stringGetter, enabledNotifs]
  );

  return [notificationSection];
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
