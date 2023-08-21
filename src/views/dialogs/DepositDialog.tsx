import { useState } from 'react';
import styled, { type AnyStyledComponent } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { useBreakpoints, useStringGetter } from '@/hooks';

import { Dialog, DialogPlacement } from '@/components/Dialog';

import { DepositForm } from '@/views/forms/AccountManagementForms/DepositForm';
import { TestnetDepositForm } from '@/views/forms/AccountManagementForms/TestnetDepositForm';

import { layoutMixins } from '@/styles/layoutMixins';

type ElementProps = {
  setIsOpen?: (open: boolean) => void;
};

export const DepositDialog = ({ setIsOpen }: ElementProps) => {
  const [showTestDeposit, setShowTestDeposit] = useState(true);
  const stringGetter = useStringGetter();
  const { isMobile } = useBreakpoints();

  const closeDialog = () => setIsOpen?.(false);

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.DEPOSIT })}
      description={showTestDeposit && 'Test funds will be sent directly to your dYdX account.'}
      placement={isMobile ? DialogPlacement.FullScreen : DialogPlacement.Default}
    >
      <Styled.Content>
        {showTestDeposit ? <TestnetDepositForm onDeposit={closeDialog} /> : <DepositForm />}
        {/* TODO TRCL-1693 - uncomment when deposit form is ready */}
         {import.meta.env.MODE !== 'production' && (
          <Styled.TextToggle onClick={() => setShowTestDeposit(!showTestDeposit)}>
            {showTestDeposit ? 'Show deposit form (Under Construction)' : 'Show test faucet'}
          </Styled.TextToggle>
        )}
      </Styled.Content>
    </Dialog>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.TextToggle = styled.div`
  ${layoutMixins.stickyFooter}
  color: var(--color-accent);
  cursor: pointer;

  margin-top: auto;

  &:hover {
    text-decoration: underline;
  }
`;

Styled.Content = styled.div`
  ${layoutMixins.stickyArea0}
  --stickyArea0-bottomHeight: 2rem;
  --stickyArea0-bottomGap: 1rem;
  --stickyArea0-totalInsetBottom: 0.5rem;

  ${layoutMixins.flexColumn}
  gap: 1rem;
`;
