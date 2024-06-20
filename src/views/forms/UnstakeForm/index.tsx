import React, { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';

import { type NumberFormatValues } from 'react-number-format';
import styled from 'styled-components';
import { formatUnits } from 'viem';

import { AlertType } from '@/constants/alerts';
import { ButtonAction } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { NumberSign } from '@/constants/numbers';

import { useAccountBalance } from '@/hooks/useAccountBalance';
import { useStakingValidator } from '@/hooks/useStakingValidator';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { DiffOutput } from '@/components/DiffOutput';
import { FormInput } from '@/components/FormInput';
import { FormMaxInputToggleButton } from '@/components/FormMaxInputToggleButton';
import { InputType } from '@/components/Input';
import { OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { ValidatorName } from '@/components/ValidatorName';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';
import { StakeButtonAlert } from '@/views/StakeRewardButtonAndReceipt';
import { UnstakeButtonAndReceipt } from '@/views/forms/UnstakeForm/UnstakeButtonAndReceipt';

import { BigNumberish, MustBigNumber } from '@/lib/numbers';
import { log } from '@/lib/telemetry';

type UnstakeFormProps = {
  onDone?: () => void;
  className?: string;
};

export const UnstakeForm = ({ onDone, className }: UnstakeFormProps) => {
  const stringGetter = useStringGetter();
  const { undelegate, getUndelegateFee } = useSubaccount();
  const { nativeStakingBalance } = useAccountBalance();
  const { stakingValidators, currentDelegations } = useStakingValidator() ?? {};
  const { chainTokenLabel, chainTokenDecimals } = useTokenConfigs();

  // Form states
  const [error, setError] = useState<StakeButtonAlert>();
  const [fee, setFee] = useState<BigNumberish>();
  const [amounts, setAmounts] = useState<Record<string, number | undefined>>({});
  const [isLoading, setIsLoading] = useState(false);

  const isEachAmountValid = useMemo(() => {
    return (
      Object.keys(amounts).length > 0 &&
      Object.keys(amounts).every((validator) => {
        const balance = parseFloat(
          currentDelegations?.find((delegation) => delegation.validator === validator)?.amount ??
            '0'
        );
        const validatorAmount = amounts[validator];
        if (!validatorAmount) return true;
        return validatorAmount && validatorAmount > 0 && balance && validatorAmount <= balance;
      })
    );
  }, [amounts, currentDelegations]);

  const totalAmount = useMemo(() => {
    return Object.values(amounts).reduce((acc: number, value) => acc + (value ?? 0), 0);
  }, [amounts]);

  const isTotalAmountValid = totalAmount && totalAmount > 0;
  const isAmountValid = isEachAmountValid && isTotalAmountValid;
  const allAmountsEmpty =
    !amounts || Object.values(amounts).filter((amount) => amount !== undefined).length === 0;
  const showClearButton =
    amounts && Object.values(amounts).filter((amount) => amount !== undefined).length > 0;

  useEffect(() => {
    if (!isAmountValid && !allAmountsEmpty) {
      setError({
        key: STRING_KEYS.ISOLATED_MARGIN_ADJUSTMENT_INVALID_AMOUNT,
        type: AlertType.Error,
        message: stringGetter({ key: STRING_KEYS.ISOLATED_MARGIN_ADJUSTMENT_INVALID_AMOUNT }),
      });
    } else {
      setError({
        key: STRING_KEYS.UNSTAKING_PERIOD_DESCRIPTION,
        type: AlertType.Info,
        message: stringGetter({ key: STRING_KEYS.UNSTAKING_PERIOD_DESCRIPTION }),
      });
    }
  }, [stringGetter, isAmountValid, allAmountsEmpty]);

  useEffect(() => {
    if (isAmountValid) {
      setIsLoading(true);
      getUndelegateFee(amounts)
        .then((stdFee) => {
          if (stdFee.amount.length > 0) {
            const feeAmount = stdFee.amount[0].amount;
            setFee(MustBigNumber(formatUnits(BigInt(feeAmount), chainTokenDecimals)));
          }
        })
        .catch((err) => {
          log('UnstakeForm/getDelegateFee', err);
          setFee(undefined);
        })
        .then(() => {
          setIsLoading(false);
        });
    } else {
      setFee(undefined);
    }
  }, [setFee, getUndelegateFee, isAmountValid, chainTokenDecimals, amounts]);

  const onUnstake = useCallback(async () => {
    if (!isAmountValid && Object.keys(amounts).length > 0) {
      return;
    }
    try {
      setIsLoading(true);
      await undelegate(amounts);
      onDone?.();
    } catch (err) {
      log('UnstakeForm/onUnstake', err);
      setError({
        key: err.message,
        type: AlertType.Error,
        message: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAmountValid, amounts, undelegate, onDone]);

  const onChangeAmount = useCallback((validator: string, value: number | undefined) => {
    setAmounts((a) => ({ ...a, [validator]: value }));
  }, []);

  const setAllUnstakeAmountsToMax = useCallback(() => {
    currentDelegations?.forEach((delegation) => {
      onChangeAmount(delegation.validator, MustBigNumber(delegation.amount).toNumber());
    });
  }, [currentDelegations, onChangeAmount]);

  const clearAllUnstakeAmounts = useCallback(() => {
    currentDelegations?.forEach((delegation) => {
      onChangeAmount(delegation.validator, undefined);
    });
  }, [currentDelegations, onChangeAmount]);

  let description = stringGetter({
    key: STRING_KEYS.CURRENTLY_STAKING,
    params: {
      AMOUNT: (
        <$StakedAmount>
          {nativeStakingBalance}
          <Tag>{chainTokenLabel}</Tag>
        </$StakedAmount>
      ),
    },
  });
  if (currentDelegations?.length === 1) {
    description = stringGetter({
      key: STRING_KEYS.CURRENTLY_STAKING_WITH,
      params: {
        VALIDATOR: (
          <ValidatorName validator={stakingValidators?.[currentDelegations[0].validator]?.[0]} />
        ),
      },
    });
  }

  if (!stakingValidators) {
    return null;
  }

  return (
    <$Form
      className={className}
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        onUnstake();
      }}
    >
      <$Description>{description}</$Description>
      {currentDelegations?.length === 1 && (
        <$WithDetailsReceipt
          side="bottom"
          detailItems={[
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
                  value={parseFloat(currentDelegations[0].amount)}
                  sign={NumberSign.Negative}
                  newValue={
                    parseFloat(currentDelegations[0].amount) -
                    (amounts[currentDelegations[0].validator] ?? 0)
                  }
                  hasInvalidNewValue={
                    (amounts[currentDelegations[0].validator] ?? 0) >
                    parseFloat(currentDelegations[0].amount)
                  }
                  withDiff={Boolean(
                    (amounts[currentDelegations[0].validator] ?? 0) &&
                      parseFloat(currentDelegations[0].amount)
                  )}
                />
              ),
            },
          ]}
        >
          <FormInput
            id="unstakeAmount"
            label={stringGetter({ key: STRING_KEYS.AMOUNT_TO_UNSTAKE })}
            type={InputType.Number}
            onChange={({ floatValue }: NumberFormatValues) =>
              onChangeAmount(currentDelegations[0].validator, floatValue)
            }
            value={amounts[currentDelegations[0].validator] ?? undefined}
            slotRight={
              <FormMaxInputToggleButton
                isInputEmpty={!amounts[currentDelegations[0].validator]}
                isLoading={isLoading}
                onPressedChange={(isPressed: boolean) =>
                  isPressed
                    ? onChangeAmount(
                        currentDelegations[0].validator,
                        parseFloat(currentDelegations[0].amount)
                      )
                    : onChangeAmount(currentDelegations[0].validator, undefined)
                }
              />
            }
          />
        </$WithDetailsReceipt>
      )}

      {(currentDelegations?.length ?? 0) > 1 && (
        <$GridLayout>
          <div>
            {stringGetter({
              key: STRING_KEYS.VALIDATOR,
            })}
          </div>
          <$SpacedRow>
            {stringGetter({
              key: STRING_KEYS.AMOUNT_TO_UNSTAKE,
            })}
            {showClearButton ? (
              <$Button onClick={clearAllUnstakeAmounts} action={ButtonAction.Reset}>
                {stringGetter({ key: STRING_KEYS.CLEAR })}
              </$Button>
            ) : (
              <$AllButton onClick={setAllUnstakeAmountsToMax}>
                {stringGetter({ key: STRING_KEYS.ALL })}
              </$AllButton>
            )}
          </$SpacedRow>
          {currentDelegations?.map((delegation) => {
            const balance = MustBigNumber(delegation.amount).toNumber();
            return (
              <React.Fragment key={delegation.validator}>
                <ValidatorName validator={stakingValidators[delegation.validator]?.[0]} />
                <FormInput
                  key={delegation.validator}
                  type={InputType.Number}
                  onChange={({ floatValue }: NumberFormatValues) =>
                    onChangeAmount(delegation.validator, floatValue)
                  }
                  value={amounts[delegation.validator] ?? undefined}
                  slotRight={
                    <FormMaxInputToggleButton
                      isInputEmpty={!amounts[delegation.validator]}
                      isLoading={isLoading}
                      onPressedChange={(isPressed: boolean) =>
                        isPressed
                          ? onChangeAmount(delegation.validator, balance)
                          : onChangeAmount(delegation.validator, undefined)
                      }
                    />
                  }
                />
              </React.Fragment>
            );
          })}
        </$GridLayout>
      )}

      <$Footer>
        <UnstakeButtonAndReceipt
          error={error}
          fee={fee ?? undefined}
          isLoading={isLoading || Boolean(isAmountValid && !fee)}
          amount={totalAmount}
          allAmountsEmpty={allAmountsEmpty}
        />
      </$Footer>
    </$Form>
  );
};

const $Form = styled.form`
  ${formMixins.transfersForm}
`;

const $Description = styled.div`
  ${layoutMixins.row}
  gap: 0.25rem;

  color: var(--color-text-0);
`;

const $GridLayout = styled.div<{ showMigratePanel?: boolean }>`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

const $Footer = styled.footer`
  ${formMixins.footer}
  --stickyFooterBackdrop-outsetY: var(--dialog-content-paddingBottom);

  display: grid;
  gap: var(--form-input-gap);
`;
const $WithDetailsReceipt = styled(WithDetailsReceipt)`
  --withReceipt-backgroundColor: var(--color-layer-2);
`;

const $StakedAmount = styled.span`
  ${layoutMixins.inlineRow}
  color: var(--color-text-1);
`;

const $SpacedRow = styled.div`
  ${layoutMixins.spacedRow}
`;

const $Button = styled(Button)`
  --button-border: none;
  --button-padding: 0;
  --button-height: auto;
  --button-hover-filter: none;
`;

const $AllButton = styled($Button)`
  --button-textColor: var(--color-accent);
`;
