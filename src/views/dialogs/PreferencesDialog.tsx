import { DialogProps, PreferencesDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { usePreferenceMenu } from '@/hooks/usePreferenceMenu';
import { useStringGetter } from '@/hooks/useStringGetter';

import { ComboboxDialogMenu } from '@/components/ComboboxDialogMenu';

export const PreferencesDialog = ({ setIsOpen }: DialogProps<PreferencesDialogProps>) => {
  const stringGetter = useStringGetter();
  const preferenceItems = usePreferenceMenu();

  return (
    <ComboboxDialogMenu
      isOpen
      withSearch={false}
      title={stringGetter({ key: STRING_KEYS.PREFERENCES })}
      items={preferenceItems}
      setIsOpen={setIsOpen}
      tw="[--comboboxDialogMenu-item-padding: 0.5rem 1.25rem;] [--dialog-content-paddingBottom:0.5rem]"
    />
  );
};
