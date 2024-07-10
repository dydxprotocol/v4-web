import { STRING_KEYS } from '@/constants/localization';

import { useCommandMenu } from '@/hooks/useCommandMenu';
import { useStringGetter } from '@/hooks/useStringGetter';

import { ComboboxDialogMenu } from '@/components/ComboboxDialogMenu';
import { useGlobalCommands } from '@/views/menus/useGlobalCommands';

export const GlobalCommandDialog = () => {
  const { isCommandMenuOpen, setIsCommandMenuOpen, closeCommandMenu } = useCommandMenu();
  const stringGetter = useStringGetter();

  return (
    <ComboboxDialogMenu
      isOpen={isCommandMenuOpen}
      setIsOpen={setIsCommandMenuOpen}
      title={stringGetter({ key: STRING_KEYS.COMMANDS })}
      items={useGlobalCommands()}
      onItemSelected={closeCommandMenu}
      inputPlaceholder={stringGetter({ key: STRING_KEYS.SEARCH })}
      slotEmpty={stringGetter({ key: STRING_KEYS.NO_RESULTS })}
    />
  );
};
