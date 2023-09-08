import { useCommandMenu } from '@/hooks';
import { useGlobalCommands } from '@/views/menus/useGlobalCommands';
import { ComboboxDialogMenu } from '@/components/ComboboxDialogMenu';

export const GlobalCommandDialog = () => {
  const { isCommandMenuOpen, setIsCommandMenuOpen, closeCommandMenu } = useCommandMenu();

  return (
    <ComboboxDialogMenu
      isOpen={isCommandMenuOpen}
      setIsOpen={setIsCommandMenuOpen}
      title="Commands"
      items={useGlobalCommands()}
      onItemSelected={closeCommandMenu}
      inputPlaceholder="Type a command or search..."
      slotEmpty="No commands found. ¯\_(🦔)_/¯" // {<>No commands found.<br />🦔 🤷🏽</>}
    />
  );
};
