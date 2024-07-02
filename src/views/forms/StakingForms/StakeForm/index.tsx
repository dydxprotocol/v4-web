import { Dispatch, SetStateAction, useCallback, useEffect, useState, type FormEvent } from 'react';

import BigNumber from 'bignumber.js';
import styled from 'styled-components';
import { formatUnits } from 'viem';

import { AMOUNT_RESERVED_FOR_GAS_DYDX } from '@/constants/account';
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
import { useURLConfigs } from '@/hooks/useURLConfigs';

import { formMixins } from '@/styles/formMixins';

import { DiffOutput } from '@/components/DiffOutput';
import { Link } from '@/components/Link';
import { Output, OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { WithTooltip } from '@/components/WithTooltip';
import { StakeButtonAlert } from '@/views/forms/StakingForms/shared/StakeRewardButtonAndReceipt';

import { track } from '@/lib/analytics';
import { BigNumberish, MustBigNumber } from '@/lib/numbers';
import { log } from '@/lib/telemetry';
import { hashFromTx } from '@/lib/txUtils';

import { StakeFormInputContents } from './StakeFormInputContents';
import { StakeFormPreviewContents } from './StakeFormPreviewContents';
import { ValidatorDropdown } from './ValidatorDropdown';

type ElementProps = {
  currentStep: StakeFormSteps;
  setCurrentStep: Dispatch<SetStateAction<StakeFormSteps>>;
  onDone?: () => void;
};

type StyleProps = {
  className?: string;
};

export const StakeForm = ({
  currentStep,
  setCurrentStep,
  onDone,
  className,
}: ElementProps & StyleProps) => {
  const stringGetter = useStringGetter();
  const { delegate, getDelegateFee } = useSubaccount();
  const { nativeTokenBalance: balance, nativeStakingBalance } = useAccountBalance();
  const { selectedValidator, setSelectedValidator, defaultValidator } = useStakingValidator() ?? {};
  const { chainTokenLabel, chainTokenDecimals } = useTokenConfigs();
  const { mintscanValidatorsLearnMore } = useURLConfigs();

  // Form states
  const [error, setError] = useState<StakeButtonAlert>();
  const [fee, setFee] = useState<BigNumberish>();
  const [amountBN, setAmountBN] = useState<BigNumber | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  // BN
  const maxAmountBN = MustBigNumber(Math.max(balance.toNumber() - AMOUNT_RESERVED_FOR_GAS_DYDX, 0));
  const newStakedBalanceBN = amountBN
    ? MustBigNumber(nativeStakingBalance).plus(amountBN)
    : undefined;

  const isAmountValid = amountBN && amountBN.gt(0) && amountBN.lte(maxAmountBN);
  const isAmountEnoughForGas = balance.gte(AMOUNT_RESERVED_FOR_GAS_DYDX);

  useEffect(() => {
    // Initalize to default validator once on mount
    setSelectedValidator(defaultValidator);
  }, []);

  useEffect(() => {
    if (!isAmountEnoughForGas) {
      setError({
        key: STRING_KEYS.INSUFFICIENT_STAKE_BALANCE,
        type: AlertType.Error,
        message: stringGetter({ key: STRING_KEYS.INSUFFICIENT_STAKE_BALANCE }),
      });
    } else if (amountBN && !isAmountValid) {
      setError({
        key: STRING_KEYS.ISOLATED_MARGIN_ADJUSTMENT_INVALID_AMOUNT,
        type: AlertType.Error,
        message: stringGetter({ key: STRING_KEYS.ISOLATED_MARGIN_ADJUSTMENT_INVALID_AMOUNT }),
      });
    } else {
      setError(undefined);
    }
  }, [stringGetter, amountBN, isAmountValid, isAmountEnoughForGas]);

  useEffect(() => {
    if (isAmountValid && selectedValidator) {
      setIsLoading(true);
      getDelegateFee(selectedValidator.operatorAddress, amountBN.toNumber())
        .then((stdFee) => {
          if (stdFee.amount.length > 0) {
            const feeAmount = stdFee.amount[0].amount;
            setFee(MustBigNumber(formatUnits(BigInt(feeAmount), chainTokenDecimals)));
          }
        })
        .catch((err) => {
          log('StakeForm/getDelegateFee', err);
          setFee(undefined);
        })
        .then(() => {
          setIsLoading(false);
        });
    } else {
      setFee(undefined);
    }
  }, [getDelegateFee, amountBN, selectedValidator, isAmountValid, chainTokenDecimals]);

  const onStake = useCallback(async () => {
    if (!isAmountValid || !selectedValidator) {
      return;
    }
    try {
      setIsLoading(true);
      const tx = await delegate(selectedValidator.operatorAddress, amountBN.toNumber());
      const txHash = hashFromTx(tx.hash);

      track(
        AnalyticsEvents.StakeTransaction({
          txHash,
          amount: amountBN.toNumber(),
          validatorAddress: selectedValidator.operatorAddress,
          defaultValidatorAddress: defaultValidator?.operatorAddress,
        })
      );
      onDone?.();
    } catch (err) {
      log('StakeForm/onStake', err);
      setError({ key: err.message, type: AlertType.Error, message: err.message });
    } finally {
      setIsLoading(false);
    }
  }, [isAmountValid, selectedValidator, defaultValidator, amountBN, delegate, onDone]);

  const validatorSelectorDetailItem = {
    key: 'validator',
    label: (
      <WithTooltip
        tooltipString={stringGetter({
          key: STRING_KEYS.VALIDATORS_INFO_LINK,
          params: {
            MINTSCAN_LINK: (
              <$Link href={mintscanValidatorsLearnMore}>
                {stringGetter({ key: STRING_KEYS.MINTSCAN })}
              </$Link>
            ),
          },
        })}
      >
        {stringGetter({
          key: STRING_KEYS.VALIDATOR,
        })}
      </WithTooltip>
    ),
    value: (
      <ValidatorDropdown
        selectedValidator={selectedValidator}
        setSelectedValidator={setSelectedValidator}
      />
    ),
  };

  const detailItems = [
    {
      key: 'fees',
      label: (
        <span>
          {stringGetter({ key: STRING_KEYS.EST_GAS })} <Tag>{chainTokenLabel}</Tag>
        </span>
      ),
      value: <Output type={OutputType.Asset} value={fee} />,
    },
    {
      key: 'balance',
      label: (
        <span>
          {stringGetter({ key: STRING_KEYS.STAKED_BALANCE })} <Tag>{chainTokenLabel}</Tag>
        </span>
      ),
      value: (
        <DiffOutput
          type={OutputType.Asset}
          value={nativeStakingBalance}
          sign={NumberSign.Positive}
          newValue={newStakedBalanceBN}
          hasInvalidNewValue={newStakedBalanceBN?.isNegative()}
          withDiff={
            newStakedBalanceBN !== undefined &&
            !MustBigNumber(nativeStakingBalance).eq(newStakedBalanceBN ?? 0)
          }
        />
      ),
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
            onStake();
        }
      }}
    >
      {currentStep === StakeFormSteps.EditInputs && (
        <StakeFormInputContents
          detailItems={[validatorSelectorDetailItem].concat(detailItems)}
          selectedValidator={selectedValidator}
          stakedAmount={amountBN}
          maxStakeAmount={maxAmountBN}
          fee={fee}
          error={error}
          isLoading={isLoading}
          setStakedAmount={setAmountBN}
        />
      )}

      {currentStep === StakeFormSteps.PreviewOrder && (
        <StakeFormPreviewContents
          detailItems={detailItems}
          selectedValidator={selectedValidator}
          stakedAmount={amountBN?.toNumber() ?? 0}
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

const $Link = styled(Link)`
  display: inline;
  text-decoration: underline;
`;
