import { useCallback, useEffect, useState, type FormEvent } from 'react';

import { type NumberFormatValues } from 'react-number-format';
import styled from 'styled-components';
import { formatUnits } from 'viem';

import { AlertType } from '@/constants/alerts';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { NumberSign } from '@/constants/numbers';

import { useAccountBalance } from '@/hooks/useAccountBalance';
import { useStakingValidator } from '@/hooks/useStakingValidator';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { formMixins } from '@/styles/formMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { DiffOutput } from '@/components/DiffOutput';
import { FormInput } from '@/components/FormInput';
import { FormMaxInputToggleButton } from '@/components/FormMaxInputToggleButton';
import { InputType } from '@/components/Input';
import { Link } from '@/components/Link';
import { OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';
import { StakeButtonAndReceipt } from '@/views/forms/StakeForm/StakeButtonAndReceipt';

import { useAppDispatch } from '@/state/appTypes';
import { forceOpenDialog } from '@/state/dialogs';

import { BigNumberish, MustBigNumber } from '@/lib/numbers';
import { log } from '@/lib/telemetry';

type StakeFormProps = {
  onDone?: () => void;
  className?: string;
};

export const StakeForm = ({ onDone, className }: StakeFormProps) => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();

  const { delegate, getDelegateFee } = useSubaccount();
  const { nativeTokenBalance: balance } = useAccountBalance();
  const { selectedValidator } = useStakingValidator() ?? {};
  const { chainTokenLabel, chainTokenDecimals } = useTokenConfigs();

  // Form states
  const [error, setError] = useState<string>();
  const [fee, setFee] = useState<BigNumberish>();
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  const showNotEnoughGasWarning = balance.lt(fee ?? 0);

  // BN
  const amountBN = MustBigNumber(amount);
  const newBalanceBN = balance.minus(amountBN ?? 0);

  const isAmountValid = balance && amount && amountBN.gt(0) && newBalanceBN.gte(0);

  useEffect(() => {
    if (isAmountValid && selectedValidator) {
      getDelegateFee(selectedValidator.operatorAddress, amount)
        .then((stdFee) => {
          if (stdFee.amount.length > 0) {
            const feeAmount = stdFee.amount[0].amount;
            setFee(MustBigNumber(formatUnits(BigInt(feeAmount), chainTokenDecimals)));
          }
        })
        .catch((err) => {
          log('StakeForm/getDelegateFee', err);
          setFee(undefined);
        });
    } else {
      setFee(undefined);
    }
  }, [setFee, getDelegateFee, amount, selectedValidator, isAmountValid, chainTokenDecimals]);

  const onChangeAmount = (value: number | undefined) => {
    setAmount(value);
  };

  const onStake = useCallback(async () => {
    if (!isAmountValid || !selectedValidator) {
      return;
    }
    try {
      setIsLoading(true);
      await delegate(selectedValidator.operatorAddress, amount);
      onDone?.();
    } catch (err) {
      log('StakeForm/onStake', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [isAmountValid, selectedValidator, amount, delegate, onDone]);

  const amountDetailItems = [
    {
      key: 'amount',
      label: (
        <span>
          {stringGetter({ key: STRING_KEYS.UNSTAKED_BALANCE })} <Tag>{chainTokenLabel}</Tag>
        </span>
      ),
      value: (
        <DiffOutput
          type={OutputType.Asset}
          value={balance}
          sign={NumberSign.Negative}
          newValue={newBalanceBN}
          hasInvalidNewValue={newBalanceBN.isNegative()}
          withDiff={Boolean(amount && balance) && !amountBN.isNaN()}
        />
      ),
    },
  ];

  const openKeplrDialog = () =>
    dispatch(
      forceOpenDialog({
        type: DialogTypes.ExternalNavKeplr,
      })
    );

  const openStrideDialog = () =>
    dispatch(
      forceOpenDialog({
        type: DialogTypes.ExternalNavStride,
      })
    );

  return (
    <$Form
      className={className}
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        onStake();
      }}
    >
      <$Description>
        {stringGetter({
          key: STRING_KEYS.STAKE_DESCRIPTION,
        })}
      </$Description>
      <$WithDetailsReceipt side="bottom" detailItems={amountDetailItems}>
        <FormInput
          label={stringGetter({ key: STRING_KEYS.AMOUNT_TO_STAKE })}
          type={InputType.Number}
          onChange={({ floatValue }: NumberFormatValues) => onChangeAmount(floatValue)}
          value={amount ?? undefined}
          slotRight={
            <FormMaxInputToggleButton
              isInputEmpty={!amount}
              isLoading={isLoading}
              onPressedChange={(isPressed: boolean) =>
                isPressed ? onChangeAmount(balance.toNumber()) : onChangeAmount(undefined)
              }
            />
          }
          disabled={isLoading}
        />
      </$WithDetailsReceipt>

      {showNotEnoughGasWarning && (
        <AlertMessage type={AlertType.Warning}>
          {stringGetter({
            key: STRING_KEYS.TRANSFER_INSUFFICIENT_GAS,
          })}
        </AlertMessage>
      )}

      {error && <AlertMessage type={AlertType.Error}>{error}</AlertMessage>}

      <$Footer>
        <StakeButtonAndReceipt
          fee={fee ?? undefined}
          isDisabled={!isAmountValid || !fee || isLoading}
          isLoading={isLoading || Boolean(isAmountValid && !fee)}
          amount={amount}
        />
        <$LegalDisclaimer>
          {stringGetter({
            key: STRING_KEYS.STAKING_LEGAL_DISCLAIMER,
            params: {
              KEPLR_DASHBOARD_LINK: (
                <$Link withIcon onClick={openKeplrDialog}>
                  {stringGetter({ key: STRING_KEYS.KEPLR_DASHBOARD })}
                </$Link>
              ),
              STRIDE_LINK: (
                <$Link withIcon onClick={openStrideDialog}>
                  Stride
                </$Link>
              ),
            },
          })}
        </$LegalDisclaimer>
      </$Footer>
    </$Form>
  );
};

const $Form = styled.form`
  ${formMixins.transfersForm}
`;

const $Description = styled.div`
  color: var(--color-text-0);
`;

const $Footer = styled.footer`
  ${formMixins.footer}
  --stickyFooterBackdrop-outsetY: var(--dialog-content-paddingBottom);

  display: flex;
  flex-direction: column;
  gap: 1rem;
`;
const $WithDetailsReceipt = styled(WithDetailsReceipt)`
  --withReceipt-backgroundColor: var(--color-layer-2);
`;

const $LegalDisclaimer = styled.div`
  text-align: center;
  color: var(--color-text-0);
  font: var(--font-small-book);
`;

const $Link = styled(Link)`
  --link-color: var(--color-text-2);
  display: inline-flex;
`;
