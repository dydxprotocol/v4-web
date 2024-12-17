import { useState } from 'react';

import styled from 'styled-components';

import { DepositDialog2Props, DialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Dialog, DialogPlacement } from '@/components/Dialog';

import { DepositForm } from './DepositForm';
import { TokenSelect } from './TokenSelect';

export const DepositDialog2 = ({ setIsOpen }: DialogProps<DepositDialog2Props>) => {
  const { isMobile } = useBreakpoints();
  const stringGetter = useStringGetter();

  const [formState, setFormState] = useState<'form' | 'token-select'>('form');
  // TODO(deposit2): localization
  const dialogTitle =
    formState === 'form' ? stringGetter({ key: STRING_KEYS.DEPOSIT }) : 'Select Token';

  return (
    <$Dialog
      isOpen
      withAnimation
      hasHeaderBorder
      setIsOpen={setIsOpen}
      title={dialogTitle}
      placement={isMobile ? DialogPlacement.FullScreen : DialogPlacement.Default}
    >
      <div tw="flex w-[200%] overflow-hidden">
        <div
          tw="w-[50%]"
          style={{ marginLeft: formState === 'form' ? 0 : '-50%', transition: 'margin 350ms' }}
        >
          <DepositForm onTokenSelect={() => setFormState('token-select')} />
        </div>
        <div tw="w-[50%]">
          <TokenSelect onBack={() => setFormState('form')} />
        </div>
      </div>
    </$Dialog>
  );
};

const $Dialog = styled(Dialog)`
  --dialog-content-paddingTop: 0;
  --dialog-content-paddingRight: 0;
  --dialog-content-paddingBottom: 0;
  --dialog-content-paddingLeft: 0;
`;
