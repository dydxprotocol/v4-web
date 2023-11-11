import { shallowEqual, useSelector } from 'react-redux';
import styled, { type AnyStyledComponent } from 'styled-components';

import { TransferInputField, TransferType } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';
import { ButtonSize } from '@/constants/buttons';
import { isMainnet } from '@/constants/networks';
import { useStringGetter } from '@/hooks';

import { Dialog, DialogPlacement } from '@/components/Dialog';
import { ToggleGroup } from '@/components/ToggleGroup';

import { TransferForm } from '@/views/forms/TransferForm';
import { DepositForm } from '@/views/forms/AccountManagementForms/DepositForm';
import { WithdrawForm } from '@/views/forms/AccountManagementForms/WithdrawForm';
import { TestnetDepositForm } from '@/views/forms/AccountManagementForms/TestnetDepositForm';

import { getTransferInputs } from '@/state/inputsSelectors';

import abacusStateManager from '@/lib/abacus';

type ElementProps = {
  setIsOpen?: (open: boolean) => void;
};

export const ManageFundsDialog = ({ setIsOpen }: ElementProps) => {
  const stringGetter = useStringGetter();
  const { type } = useSelector(getTransferInputs, shallowEqual) || {};
  const currentType = type?.rawValue ?? TransferType.deposit.rawValue;

  const closeDialog = () => setIsOpen?.(false);

  const transferTypeConfig = {
    [TransferType.deposit.rawValue]: {
      value: TransferType.deposit.rawValue,
      label: stringGetter({ key: STRING_KEYS.DEPOSIT }),
      component: isMainnet ? (
        <DepositForm onDeposit={closeDialog} />
      ) : (
        <TestnetDepositForm onDeposit={closeDialog} />
      ),
    },
    [TransferType.withdrawal.rawValue]: {
      value: TransferType.withdrawal.rawValue,
      label: stringGetter({ key: STRING_KEYS.WITHDRAW }),
      component: <WithdrawForm />,
    },
    [TransferType.transferOut.rawValue]: {
      value: TransferType.transferOut.rawValue,
      label: stringGetter({ key: STRING_KEYS.TRANSFER }),
      component: <TransferForm onDone={closeDialog} />,
    },
  };

  return (
    <Styled.Dialog
      isOpen
      setIsOpen={setIsOpen}
      placement={DialogPlacement.FullScreen}
      title={
        <Styled.ToggleGroup
          items={Object.values(transferTypeConfig)}
          value={currentType}
          size={ButtonSize.Medium}
          onValueChange={(value: string) =>
            abacusStateManager.setTransferValue({
              field: TransferInputField.type,
              value,
            })
          }
        />
      }
      hasHeaderBorder
    >
      {transferTypeConfig[currentType].component}
    </Styled.Dialog>
  );
};
const Styled: Record<string, AnyStyledComponent> = {};

Styled.Dialog = styled(Dialog)`
  --dialog-content-paddingTop: 1.5rem;
`;

Styled.ToggleGroup = styled(ToggleGroup)`
  overflow-x: auto;

  button {
    --button-toggle-off-borderColor: trasnparent;
    --button-padding: 0 1rem;
  }
`;
