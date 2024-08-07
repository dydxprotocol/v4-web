import styled from 'styled-components';

import { DialogProps, GlobalCommandDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';

import { ComboboxDialogMenu } from '@/components/ComboboxDialogMenu';
import { useGlobalCommands } from '@/views/menus/useGlobalCommands';

export const GlobalCommandDialog = ({ setIsOpen }: DialogProps<GlobalCommandDialogProps>) => {
  const stringGetter = useStringGetter();

  return (
    <$ComboboxDialogMenu
      isOpen
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.COMMANDS })}
      items={useGlobalCommands()}
      onItemSelected={() => setIsOpen(false)}
      inputPlaceholder={stringGetter({ key: STRING_KEYS.SEARCH })}
      slotEmpty={stringGetter({ key: STRING_KEYS.NO_RESULTS })}
    />
  );
};

const $ComboboxDialogMenu = styled(ComboboxDialogMenu)`
  --dialog-inset: 2rem;
  height: var(--dialog-height); // fixed height
  @media ${breakpoints.notTablet} and (min-height: 35rem) {
    --dialog-width: 40rem;
    --dialog-inset: 8rem;
  }
`;
