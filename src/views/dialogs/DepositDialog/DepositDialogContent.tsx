import { useEffect, useState } from 'react';

import styled from 'styled-components';

import { TransferInputField, TransferType } from '@/constants/abacus';
import { AnalyticsEvents } from '@/constants/analytics';
import { isMainnet } from '@/constants/networks';

import { layoutMixins } from '@/styles/layoutMixins';

import { DepositForm } from '@/views/forms/AccountManagementForms/DepositForm';
import { TestnetDepositForm } from '@/views/forms/AccountManagementForms/TestnetDepositForm';

import abacusStateManager from '@/lib/abacus';
import { track } from '@/lib/analytics/analytics';

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
    <$Content>
      {isMainnet || !showFaucet ? (
        <DepositForm
          onDeposit={(event) => {
            track(AnalyticsEvents.TransferDeposit(event ?? {}));
            onDeposit?.();
          }}
        />
      ) : (
        <TestnetDepositForm
          onDeposit={() => {
            track(AnalyticsEvents.TransferFaucet());
            onDeposit?.();
          }}
        />
      )}
      {!isMainnet && (
        <$TextToggle onClick={() => setShowFaucet(!showFaucet)}>
          {showFaucet ? 'Show deposit form' : 'Show test faucet'}
        </$TextToggle>
      )}
    </$Content>
  );
};
const $Content = styled.div`
  ${layoutMixins.flexColumn}
  gap: 1rem;

  form {
    flex: 1;
  }
`;

const $TextToggle = styled.div`
  --stickyArea-bottomHeight: 0;

  color: var(--color-accent);
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;
