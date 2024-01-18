import { useEffect, useState } from 'react';
import styled, { type AnyStyledComponent } from 'styled-components';

import { TransferInputField, TransferType } from '@/constants/abacus';
import { isMainnet } from '@/constants/networks';
import { layoutMixins } from '@/styles/layoutMixins';

import { DepositForm } from '@/views/forms/AccountManagementForms/DepositForm';
import { TestnetDepositForm } from '@/views/forms/AccountManagementForms/TestnetDepositForm';

import abacusStateManager from '@/lib/abacus';

type ElementProps = {
  onDeposit?: () => void;
};

export const DepositDialogContent = ({ onDeposit }: ElementProps) => {
  const [showFaucet, setShowFaucet] = useState(!isMainnet);

  useEffect(() => {
    abacusStateManager.setTransferValue({
      field: TransferInputField.type,
      value: TransferType.deposit.rawValue,
    });

    return () => {
      abacusStateManager.setTransferValue({
        field: TransferInputField.type,
        value: null,
      });
    };
  }, []);

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
