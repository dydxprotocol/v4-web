import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';

import styled from 'styled-components';
import { formatUnits } from 'viem';

import { AlertType } from '@/constants/alerts';
import { AnalyticsEvents } from '@/constants/analytics';
import { STRING_KEYS } from '@/constants/localization';
import { NumberSign } from '@/constants/numbers';
import { StakeFormSteps } from '@/constants/stakingForms';

import { useAccountBalance } from '@/hooks/useAccountBalance';
import { useStakingValidator } from '@/hooks/useStakingValidator';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { formMixins } from '@/styles/formMixins';

import { DiffOutput } from '@/components/DiffOutput';
import { Output, OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { StakeButtonAlert } from '@/views/forms/StakingForms/shared/StakeRewardButtonAndReceipt';

import { track } from '@/lib/analytics';
import { BigNumberish, MustBigNumber } from '@/lib/numbers';
import { log } from '@/lib/telemetry';
import { hashFromTx } from '@/lib/txUtils';

import { UnstakeFormInputContents } from './UnstakeFormInputContents';
import { UnstakeFormPreviewContents } from './UnstakeFormPreviewContents';

type ElementProps = {
  currentStep: StakeFormSteps;
  setCurrentStep: Dispatch<SetStateAction<StakeFormSteps>>;
  onDone?: () => void;
};

type StyleProps = {
  className?: string;
};

export const UnstakeForm = ({
  currentStep,
  setCurrentStep,
  onDone,
  className,
}: ElementProps & StyleProps) => {
  const stringGetter = useStringGetter();
  const { undelegate, getUndelegateFee } = useSubaccount();
  const { nativeTokenBalance } = useAccountBalance();
  const { currentDelegations } = useStakingValidator() ?? {};
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
  const newStakedBalance = totalAmount
    ? MustBigNumber(nativeTokenBalance).plus(totalAmount)
    : undefined;

  const isTotalAmountValid = totalAmount && totalAmount > 0;
  const isAmountValid = isEachAmountValid && isTotalAmountValid;
  const allAmountsEmpty =
    !amounts || Object.values(amounts).filter((amount) => amount !== undefined).length === 0;

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
      const tx = await undelegate(amounts);
      const txHash = hashFromTx(tx.hash);

      track(
        AnalyticsEvents.UnstakeTransaction({
          txHash,
          amount: totalAmount,
          validatorAddresses: Object.keys(amounts),
        })
      );
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
  }, [isAmountValid, amounts, undelegate, onDone, totalAmount]);

  const transferDetailItems = [
    {
      key: 'balance',
      label: (
        <span>
          {stringGetter({ key: STRING_KEYS.UNSTAKED_BALANCE })} <Tag>{chainTokenLabel}</Tag>
        </span>
      ),
      value: (
        <DiffOutput
          type={OutputType.Asset}
          value={nativeTokenBalance}
          sign={NumberSign.Positive}
          newValue={newStakedBalance}
          hasInvalidNewValue={MustBigNumber(newStakedBalance).isNegative()}
          withDiff={
            newStakedBalance !== undefined &&
            !MustBigNumber(nativeTokenBalance).eq(newStakedBalance ?? 0)
          }
        />
      ),
    },
    {
      key: 'duration',
      label: <span>{stringGetter({ key: STRING_KEYS.UNSTAKING_PERIOD })}</span>,
      value: (
        <Output type={OutputType.Text} value={`30 ${stringGetter({ key: STRING_KEYS.DAYS })}`} />
      ),
    },
    {
      key: 'fees',
      label: (
        <span>
          {stringGetter({ key: STRING_KEYS.EST_GAS })} <Tag>{chainTokenLabel}</Tag>
        </span>
      ),
      value: <Output type={OutputType.Asset} value={fee} />,
    },
  ];

  return (
    <$Form
      className={className}
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        switch (currentStep) {
          case StakeFormSteps.EditInputs:
            setCurrentStep(StakeFormSteps.PreviewOrder);
            break;
          case StakeFormSteps.PreviewOrder:
          default:
            onUnstake();
        }
      }}
    >
      {currentStep === StakeFormSteps.EditInputs && (
        <UnstakeFormInputContents
          amounts={amounts}
          detailItems={transferDetailItems}
          fee={fee}
          error={error}
          isLoading={isLoading}
          setUnstakedAmounts={setAmounts}
        />
      )}

      {currentStep === StakeFormSteps.PreviewOrder && (
        <UnstakeFormPreviewContents
          amounts={amounts}
          detailItems={transferDetailItems}
          isLoading={isLoading}
          setCurrentStep={setCurrentStep}
        />
      )}
    </$Form>
  );
};

const $Form = styled.form`
  ${formMixins.stakingForm}
`;
