import styled from 'styled-components';

import { DialogProps, StakeDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Dialog } from '@/components/Dialog';
import { StakeForm } from '@/views/forms/StakeForm';

export const StakeDialog = ({ setIsOpen }: DialogProps<StakeDialogProps>) => {
  const stringGetter = useStringGetter();

  return (
    <$Dialog isOpen setIsOpen={setIsOpen} title={stringGetter({ key: STRING_KEYS.STAKE })}>
      <StakeForm onDone={() => setIsOpen?.(false)} />
    </$Dialog>
  );
};
const $Dialog = styled(Dialog)`
  --dialog-content-paddingTop: var(--default-border-width);
`;
