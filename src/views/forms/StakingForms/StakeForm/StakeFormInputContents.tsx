import { Dispatch, SetStateAction, useMemo } from 'react';

import { SelectedGasDenom } from '@dydxprotocol/v4-client-js';
import { Validator } from '@dydxprotocol/v4-client-js/build/node_modules/@dydxprotocol/v4-proto/src/codegen/cosmos/staking/v1beta1/staking';
import BigNumber from 'bignumber.js';
import { debounce } from 'lodash';
import { NumberFormatValues } from 'react-number-format';

import { AMOUNT_RESERVED_FOR_GAS_DYDX } from '@/constants/account';
import { AnalyticsEvents } from '@/constants/analytics';
import { STRING_KEYS } from '@/constants/localization';
import { NumberSign } from '@/constants/numbers';

import { useAccountBalance } from '@/hooks/useAccountBalance';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

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

type ElementProps = {
  detailItems: DetailsItem[];
  selectedValidator?: Validator;
  stakedAmount?: BigNumber;
  maxStakeAmount: BigNumber;
  fee?: BigNumberish;
  error?: StakeButtonAlert;
  isLoading: boolean;
  setStakedAmount: Dispatch<SetStateAction<BigNumber | undefined>>;
};

export const StakeFormInputContents = ({
  detailItems,
  selectedValidator,
  stakedAmount,
  maxStakeAmount,
  fee,
  error,
  isLoading,
  setStakedAmount,
}: ElementProps) => {
  const stringGetter = useStringGetter();
  const { chainTokenLabel } = useTokenConfigs();
  const { nativeTokenBalance } = useAccountBalance();

  const newBalance = nativeTokenBalance.minus(stakedAmount ?? 0);
  const isBalanceEnoughForGas = nativeTokenBalance.gte(AMOUNT_RESERVED_FOR_GAS_DYDX);

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
          value={nativeTokenBalance}
          sign={NumberSign.Negative}
          newValue={newBalance}
          hasInvalidNewValue={newBalance.isNegative()}
          withDiff={Boolean(stakedAmount && stakedAmount.isPositive() && nativeTokenBalance)}
        />
      ),
    },
  ];

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
    setStakedAmount(value);
    debouncedChangeTrack(value?.toNumber(), selectedValidator?.operatorAddress);
  };

  const onChange = ({ floatValue }: NumberFormatValues) =>
    onChangeAmount(floatValue !== undefined ? MustBigNumber(floatValue) : undefined);

  const onToggleMaxInput = (isPressed: boolean) =>
    isPressed ? onChangeAmount(MustBigNumber(maxStakeAmount)) : onChangeAmount(undefined);

  return (
    <>
      <WithDetailsReceipt
        side="bottom"
        detailItems={amountDetailItems}
        tw="[--withReceipt-backgroundColor:var(--color-layer-2)]"
      >
        <FormInput
          id="stakeAmount"
          label={stringGetter({ key: STRING_KEYS.AMOUNT_TO_STAKE })}
          type={InputType.Number}
          onChange={onChange}
          value={stakedAmount?.toNumber()}
          slotRight={
            isBalanceEnoughForGas && (
              <FormMaxInputToggleButton
                isInputEmpty={!stakedAmount}
                isLoading={isLoading}
                onPressedChange={onToggleMaxInput}
              />
            )
          }
        />
      </WithDetailsReceipt>
      <StakeRewardButtonAndReceipt
        detailItems={detailItems}
        alert={error}
        buttonText={stringGetter({
          key:
            stakedAmount !== undefined
              ? STRING_KEYS.PREVIEW_STAKE
              : STRING_KEYS.ENTER_AMOUNT_TO_STAKE,
        })}
        gasFee={fee}
        gasDenom={SelectedGasDenom.NATIVE}
        isLoading={isLoading}
        isForm
      />
    </>
  );
};
