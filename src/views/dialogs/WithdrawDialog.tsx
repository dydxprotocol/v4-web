import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { Dialog, DialogPlacement } from '@/components/Dialog';
import { WithdrawForm } from '@/views/forms/AccountManagementForms/WithdrawForm';

type ElementProps = {
  setIsOpen: (open: boolean) => void;
};

export const WithdrawDialog = ({ setIsOpen }: ElementProps) => {
  const stringGetter = useStringGetter();
  const { isTablet } = useBreakpoints();

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.WITHDRAW })}
      placement={isTablet ? DialogPlacement.FullScreen : DialogPlacement.Default}
    >
      <$Content>
        <WithdrawForm />
      </$Content>
    </Dialog>
  );
};

const $Content = styled.div`
  ${layoutMixins.stickyArea0}
  --stickyArea0-bottomHeight: 2rem;
  --stickyArea0-bottomGap: 1rem;
  --stickyArea0-totalInsetBottom: 0.5rem;

  ${layoutMixins.flexColumn}
  gap: 1rem;
`;
