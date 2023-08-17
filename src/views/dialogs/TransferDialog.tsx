import styled, { type AnyStyledComponent } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { useStringGetter } from '@/hooks';

import { Dialog } from '@/components/Dialog';
import { TransferForm } from '@/views/forms/TransferForm';

type ElementProps = {
  setIsOpen?: (open: boolean) => void;
};

export const TransferDialog = ({ setIsOpen }: ElementProps) => {
  const stringGetter = useStringGetter();

  return (
    <Styled.Dialog isOpen setIsOpen={setIsOpen} title={stringGetter({ key: STRING_KEYS.TRANSFER })}>
      <TransferForm onDone={() => setIsOpen?.(false)} />
    </Styled.Dialog>
  );
};
const Styled: Record<string, AnyStyledComponent> = {};

Styled.Dialog = styled(Dialog)`
  --dialog-content-paddingTop: var(--default-border-width);
`;
