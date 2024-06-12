import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';

import { type NumberFormatValues } from 'react-number-format';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import { parseUnits } from 'viem';

import { TransferInputField, TransferType } from '@/constants/abacus';
import { AMOUNT_RESERVED_FOR_GAS_USDC } from '@/constants/account';
import { AlertType } from '@/constants/alerts';
import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { LocalStorageKey } from '@/constants/localStorage';
import { STRING_KEYS } from '@/constants/localization';

import { useDebounce } from '@/hooks/useDebounce';
import { useNobleBalance } from '@/hooks/useNobleBalance';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { formMixins } from '@/styles/formMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { Button } from '@/components/Button';
import { FormInput } from '@/components/FormInput';
import { InputType } from '@/components/Input';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';
import { WithReceipt } from '@/components/WithReceipt';

import { closeDialog, openDialog } from '@/state/dialogs';

import abacusStateManager from '@/lib/abacus';
import { setLocalStorage } from '@/lib/localStorage';
import { MustBigNumber } from '@/lib/numbers';
import { log } from '@/lib/telemetry';
import { parseWalletError } from '@/lib/wallet';

import { SourceSelectMenu } from './AccountManagementForms/SourceSelectMenu';

export const NobleDepositForm = () => {
  const dispatch = useDispatch();
  const stringGetter = useStringGetter();

  const { usdcBalance } = useNobleBalance();
  const { usdcDecimals } = useTokenConfigs();
  const [fromAmount, setFromAmount] = useState('');
  const [error, setError] = useState<Error | null>(null);
  const debouncedAmount = useDebounce<string>(fromAmount, 500);

  const debouncedAmountBN = MustBigNumber(debouncedAmount);

  const errorMessage = useMemo(() => {
    if (error) {
      return parseWalletError({ error, stringGetter }).message;
    }

    if (MustBigNumber(fromAmount).gt(MustBigNumber(usdcBalance))) {
      return stringGetter({ key: STRING_KEYS.DEPOSIT_MORE_THAN_BALANCE });
    }

    return undefined;
  }, [error, usdcBalance, fromAmount, stringGetter]);

  useEffect(() => {
    abacusStateManager.setTransferValue({
      field: TransferInputField.type,
      value: TransferType.deposit.rawValue,
    });

    return () => {
      abacusStateManager.resetInputState();
    };
  }, []);

  const isDisabled =
    Boolean(errorMessage) || debouncedAmountBN.isNaN() || debouncedAmountBN.isZero();

  const onChangeAmount = useCallback(
    ({ value }: NumberFormatValues) => {
      setFromAmount(value);
    },
    [setFromAmount]
  );

  const onClickMax = useCallback(() => {
    if (usdcBalance) {
      const balanceBN = MustBigNumber(usdcBalance - AMOUNT_RESERVED_FOR_GAS_USDC);

      if (balanceBN.isNegative() || balanceBN.isZero()) {
        setFromAmount('');
        return;
      }
      setFromAmount(balanceBN.toString());
    }
  }, [usdcBalance, setFromAmount]);

  const onSubmit = useCallback(
    async (e: FormEvent) => {
      try {
        e.preventDefault();

        setLocalStorage({
          key: LocalStorageKey.LastNobleDepositStep,
          value: {
            value: 'ibcTransfer',
            state: 'waiting',
            usdcAmount: parseUnits(fromAmount, usdcDecimals).toString(),
          },
        });
        dispatch(closeDialog());
        dispatch(
          openDialog({
            type: DialogTypes.NobleDepositDialog,
          })
        );
      } catch (err) {
        log('NobleDepositForm/onSubmit', err);
        setError(err);
      }
    },
    [fromAmount]
  );

  return (
    <$Form onSubmit={onSubmit}>
      <$Subheader>
        Deposit IBC (Noble) USDC from other Cosmos chains. Deposit may require two transactions.
      </$Subheader>
      <SourceSelectMenu selectedChain="noble" onSelect={() => {}} />
      <$WithDetailsReceipt side="bottom">
        <FormInput
          type={InputType.Number}
          onChange={onChangeAmount}
          label={stringGetter({ key: STRING_KEYS.AMOUNT })}
          value={fromAmount}
          slotRight={
            <$FormInputButton size={ButtonSize.XSmall} onClick={onClickMax}>
              {stringGetter({ key: STRING_KEYS.MAX })}
            </$FormInputButton>
          }
        />
      </$WithDetailsReceipt>
      {errorMessage && <AlertMessage type={AlertType.Error}>{errorMessage}</AlertMessage>}
      <$Footer>
        <$WithReceipt>
          <Button
            action={ButtonAction.Primary}
            type={ButtonType.Submit}
            state={{
              isDisabled,
            }}
          >
            {stringGetter({ key: STRING_KEYS.DEPOSIT_FUNDS })}
          </Button>
        </$WithReceipt>
      </$Footer>
    </$Form>
  );
};

const $Form = styled.form`
  ${formMixins.transfersForm}
`;

const $Subheader = styled.div`
  color: var(--color-text-0);
`;

const $WithReceipt = styled(WithReceipt)`
  --withReceipt-backgroundColor: var(--color-layer-2);
`;

const $WithDetailsReceipt = styled(WithDetailsReceipt)`
  --withReceipt-backgroundColor: var(--color-layer-2);
`;

const $FormInputButton = styled(Button)`
  ${formMixins.inputInnerButton}
`;

const $Footer = styled.footer`
  ${formMixins.footer}
  --stickyFooterBackdrop-outsetY: var(--dialog-content-paddingBottom);

  button {
    --button-width: 100%;
  }
`;
