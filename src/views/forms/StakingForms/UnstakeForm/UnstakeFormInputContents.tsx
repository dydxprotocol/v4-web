import React, { Dispatch, SetStateAction, useCallback, useMemo } from 'react';

import { SelectedGasDenom } from '@dydxprotocol/v4-client-js';
import { debounce } from 'lodash';
import { type NumberFormatValues } from 'react-number-format';
import styled from 'styled-components';

import { AnalyticsEvents } from '@/constants/analytics';
import { ButtonAction } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { NumberSign } from '@/constants/numbers';

import { useStakingValidator } from '@/hooks/useStakingValidator';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { DetailsItem } from '@/components/Details';
import { DiffOutput } from '@/components/DiffOutput';
import { FormInput } from '@/components/FormInput';
import { FormMaxInputToggleButton } from '@/components/FormMaxInputToggleButton';
import { InputType } from '@/components/Input';
import { OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';
import {
  StakeButtonAlert,
  StakeRewardButtonAndReceipt,
} from '@/views/forms/StakingForms/shared/StakeRewardButtonAndReceipt';

import { track } from '@/lib/analytics';
import { BigNumberish, MustBigNumber } from '@/lib/numbers';

import { ValidatorName } from '../shared/ValidatorName';

type ElementProps = {
  amounts: Record<string, number | undefined>;
  detailItems: DetailsItem[];
  fee?: BigNumberish;
  error?: StakeButtonAlert;
  isLoading: boolean;
  setUnstakedAmounts: Dispatch<SetStateAction<Record<string, number | undefined>>>;
};

export const UnstakeFormInputContents = ({
  amounts,
  detailItems,
  fee,
  error,
  isLoading,
  setUnstakedAmounts,
}: ElementProps) => {
  const stringGetter = useStringGetter();
  const { chainTokenLabel } = useTokenConfigs();
  const { stakingValidators, currentDelegations } = useStakingValidator() ?? {};

  const allAmountsEmpty =
    !amounts || Object.values(amounts).filter((amount) => amount !== undefined).length === 0;
  const showClearButton =
    amounts && Object.values(amounts).filter((amount) => amount !== undefined).length > 0;

  const debouncedChangeTrack = useMemo(
    () =>
      debounce((amount: number | undefined, validator: string) => {
        track(
          AnalyticsEvents.UnstakeInput({
            amount,
            validatorAddress: validator,
          })
        );
      }, 1000),
    []
  );

  const onChangeAmount = useCallback(
    (validator: string, value: number | undefined) => {
      setUnstakedAmounts((a) => ({ ...a, [validator]: value }));
      debouncedChangeTrack(value, validator);
    },
    [setUnstakedAmounts, debouncedChangeTrack]
  );

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

  return (
    <>
      {currentDelegations?.length === 1 ? (
        <$WithDetailsReceipt
          side="bottom"
          detailItems={[
            {
              key: 'amount',
              label: (
                <$InlineRow>
                  {stringGetter({ key: STRING_KEYS.UNSTAKED_BALANCE })}
                  <Tag>{chainTokenLabel}</Tag>
                </$InlineRow>
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
      ) : (currentDelegations?.length ?? 0) > 1 ? (
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
          {stakingValidators &&
            currentDelegations?.map((delegation) => {
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
      ) : null}
      <StakeRewardButtonAndReceipt
        detailItems={detailItems}
        alert={error}
        buttonText={stringGetter({
          key: allAmountsEmpty ? STRING_KEYS.ENTER_AMOUNT_TO_UNSTAKE : STRING_KEYS.PREVIEW_UNSTAKE,
        })}
        gasFee={fee}
        gasDenom={SelectedGasDenom.NATIVE}
        isLoading={isLoading}
        isForm
      />
    </>
  );
};

const $GridLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

const $WithDetailsReceipt = styled(WithDetailsReceipt)`
  --withReceipt-backgroundColor: var(--color-layer-2);
`;

const $InlineRow = styled.span`
  ${layoutMixins.inlineRow}
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
