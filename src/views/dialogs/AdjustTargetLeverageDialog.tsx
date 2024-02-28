import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { Dialog } from '@/components/Dialog';

import { AdjustTargetLeverageForm } from '../forms/AdjustTargetLeverageForm';

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
      <$Content>
        <AdjustTargetLeverageForm onSetTargetLeverage={() => setIsOpen?.(false)} />
      </$Content>
    </Dialog>
  );
};
const $Content = styled.div`
  ${layoutMixins.column}
  gap: 1rem;
`;
