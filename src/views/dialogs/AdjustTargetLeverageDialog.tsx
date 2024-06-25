import styled from 'styled-components';

import { AdjustTargetLeverageDialogProps, DialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { Dialog } from '@/components/Dialog';

import { AdjustTargetLeverageForm } from '../forms/AdjustTargetLeverageForm';

export const AdjustTargetLeverageDialog = ({
  setIsOpen,
}: DialogProps<AdjustTargetLeverageDialogProps>) => {
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
