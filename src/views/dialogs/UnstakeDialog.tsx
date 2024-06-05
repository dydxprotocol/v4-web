import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Dialog } from '@/components/Dialog';

import { UnstakeForm } from '../forms/UnstakeForm';

type ElementProps = {
  setIsOpen?: (open: boolean) => void;
};

export const UnstakeDialog = ({ setIsOpen }: ElementProps) => {
  const stringGetter = useStringGetter();

  return (
    <$Dialog isOpen setIsOpen={setIsOpen} title={stringGetter({ key: STRING_KEYS.UNSTAKE })}>
      <UnstakeForm onDone={() => setIsOpen?.(false)} />
    </$Dialog>
  );
};
const $Dialog = styled(Dialog)`
  --dialog-content-paddingTop: var(--default-border-width);
`;
