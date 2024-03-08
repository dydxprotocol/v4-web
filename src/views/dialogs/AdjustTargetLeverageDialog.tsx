import styled, { AnyStyledComponent } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';

import { Dialog } from '@/components/Dialog';

type ElementProps = {
  setIsOpen?: (open: boolean) => void;
};

export const AdjustTargetLeverageDialog = ({ setIsOpen }: ElementProps) => {
  const stringGetter = useStringGetter();

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.ADJUST_TARGET_LEVERAGE })}
    >
      <Styled.Content>Adjust Leverage</Styled.Content>
    </Dialog>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Content = styled.div`
  ${layoutMixins.column}
  gap: 1rem;
`;
