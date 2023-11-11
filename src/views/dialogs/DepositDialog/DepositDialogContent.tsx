import { useState } from 'react';
import styled, { type AnyStyledComponent } from 'styled-components';

import { isMainnet } from '@/constants/networks';
import { layoutMixins } from '@/styles/layoutMixins';

import { DepositForm } from '@/views/forms/AccountManagementForms/DepositForm';
import { TestnetDepositForm } from '@/views/forms/AccountManagementForms/TestnetDepositForm';

type ElementProps = {
  onDeposit?: () => void;
};

export const DepositDialogContent = ({ onDeposit }: ElementProps) => {
  const [showFaucet, setShowFaucet] = useState(!isMainnet);

  return (
    <Styled.Content>
      {isMainnet || !showFaucet ? (
        <DepositForm onDeposit={onDeposit} />
      ) : (
        <TestnetDepositForm onDeposit={onDeposit} />
      )}
      {!isMainnet && (
        <Styled.TextToggle onClick={() => setShowFaucet(!showFaucet)}>
          {showFaucet ? 'Show deposit form' : 'Show test faucet'}
        </Styled.TextToggle>
      )}
    </Styled.Content>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Content = styled.div`
  ${layoutMixins.flexColumn}
  gap: 1rem;

  form {
    flex: 1;
  }
`;

Styled.TextToggle = styled.div`
  ${layoutMixins.stickyFooter}
  --stickyArea-bottomHeight: 0;

  color: var(--color-accent);
  cursor: pointer;

  margin-top: auto;

  &:hover {
    text-decoration: underline;
  }
`;
