import { DialogProps, DisplaySettingsDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Dialog } from '@/components/Dialog';

import { DisplaySettings } from '../DisplaySettings';

export const DisplaySettingsDialog = ({ setIsOpen }: DialogProps<DisplaySettingsDialogProps>) => {
  const stringGetter = useStringGetter();

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.DISPLAY_SETTINGS })}
    >
      <DisplaySettings />
    </Dialog>
  );
};
