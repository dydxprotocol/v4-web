import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';

import BigNumber from 'bignumber.js';
import { debounce } from 'lodash';
import { type NumberFormatValues } from 'react-number-format';
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

import { formMixins } from '@/styles/formMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { DiffOutput } from '@/components/DiffOutput';
import { FormInput } from '@/components/FormInput';
import { FormMaxInputToggleButton } from '@/components/FormMaxInputToggleButton';
import { Icon, IconName } from '@/components/Icon';
import { InputType } from '@/components/Input';
import { Output, OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { ValidatorFaviconIcon } from '@/components/ValidatorName';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';
import { StakeButtonAlert } from '@/views/forms/StakingForms/shared/StakeRewardButtonAndReceipt';

import { track } from '@/lib/analytics';
import { BigNumberish, MustBigNumber } from '@/lib/numbers';
import { log } from '@/lib/telemetry';
import { hashFromTx } from '@/lib/txUtils';

import { StakeButtonAndReceipt } from './StakeButtonAndReceipt';

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
  const { nativeTokenBalance: balance } = useAccountBalance();
  const { selectedValidator, setSelectedValidator, defaultValidator } = useStakingValidator() ?? {};
  const { chainTokenLabel, chainTokenDecimals } = useTokenConfigs();

  // Form states
  const [error, setError] = useState<StakeButtonAlert>();
  const [fee, setFee] = useState<BigNumberish>();
  const [amountBN, setAmountBN] = useState<BigNumber | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  // BN
  const newBalanceBN = balance.minus(amountBN ?? 0);
  const maxAmountBN = MustBigNumber(Math.max(balance.toNumber() - AMOUNT_RESERVED_FOR_GAS_DYDX, 0));

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

  const debouncedChangeTrack = useMemo(
    () =>
      debounce((amount?: number, validator?: string) => {
        track(
          AnalyticsEvents.StakeInput({
            amount,
            validatorAddress: validator,
          })
        );
      }, 1000),
    []
  );

  const onChangeAmount = (value?: BigNumber) => {
    setAmountBN(value);
    debouncedChangeTrack(value?.toNumber(), selectedValidator?.operatorAddress);
  };

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
          withDiff={amountBN && balance && !amountBN.isNaN()}
        />
      ),
    },
  ];

  return (
    <$Form
      className={className}
      onSubmit={(e: FormEvent) => {
        switch (currentStep) {
          case StakeFormSteps.EditInputs:
            e.preventDefault();
            setCurrentStep(StakeFormSteps.PreviewOrder);
            break;
          case StakeFormSteps.PreviewOrder:
          default:
            e.preventDefault();
            onStake();
        }
      }}
    >
      {currentStep === StakeFormSteps.PreviewOrder && (
        <$TwoColumns>
          <$Column>
            {stringGetter({ key: STRING_KEYS.AMOUNT_TO_STAKE })}
            <$StakeBox>
              <$AssetIcon symbol={chainTokenLabel} />
              <Output
                value={amountBN ? amountBN.toNumber() : undefined}
                type={OutputType.Asset}
                tag={chainTokenLabel}
              />
            </$StakeBox>
          </$Column>
          <Icon iconName={IconName.Arrow} />
          <$Column>
            {stringGetter({ key: STRING_KEYS.VALIDATOR })}
            <$StakeBox>
              <$ValidatorIcon
                url={selectedValidator?.description?.website}
                fallbackText={selectedValidator?.description?.moniker}
              />
              {selectedValidator?.description?.moniker}
            </$StakeBox>
          </$Column>
        </$TwoColumns>
      )}

      {currentStep === StakeFormSteps.EditInputs && (
        <>
          <$WithDetailsReceipt side="bottom" detailItems={amountDetailItems}>
            <FormInput
              id="stakeAmount"
              label={stringGetter({ key: STRING_KEYS.AMOUNT_TO_STAKE })}
              type={InputType.Number}
              onChange={({ floatValue }: NumberFormatValues) =>
                onChangeAmount(floatValue !== undefined ? MustBigNumber(floatValue) : undefined)
              }
              value={amountBN ? amountBN.toNumber() : undefined}
              slotRight={
                isAmountEnoughForGas && (
                  <FormMaxInputToggleButton
                    isInputEmpty={!amountBN}
                    isLoading={isLoading}
                    onPressedChange={(isPressed: boolean) =>
                      isPressed ? onChangeAmount(maxAmountBN) : onChangeAmount(undefined)
                    }
                  />
                )
              }
            />
          </$WithDetailsReceipt>
          <$Footer>
            <StakeButtonAndReceipt
              error={error}
              fee={fee}
              isLoading={isLoading}
              amount={amountBN}
              selectedValidator={selectedValidator}
              setSelectedValidator={setSelectedValidator}
            />
          </$Footer>
        </>
      )}
    </$Form>
  );
};

const $Form = styled.form`
  ${formMixins.transfersForm}
  --color-text-form: var(--color-text-0);
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
  color: var(--color-text-form);
`;

const $TwoColumns = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  align-items: center;
`;

const $Column = styled.div`
  display: flex;
  flex-direction: column;
  color: var(--color-text-0);
  font: var(--font-small-medium);
  flex-basis: 50%;
  align-items: center;
  gap: 0.5rem;
`;

const $StakeBox = styled.div`
  background-color: var(--color-layer-4);
  border-radius: 0.5em;
  width: 100%;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 1rem 0.5rem;

  color: var(--color-text-1);
  font: var(--font-mini-medium);
`;

const $AssetIcon = styled(AssetIcon)`
  font-size: 2rem;
`;

const $ValidatorIcon = styled(ValidatorFaviconIcon)`
  height: 2rem;
  width: 2rem;
`;
