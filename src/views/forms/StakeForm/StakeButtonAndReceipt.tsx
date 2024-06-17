import { SelectedGasDenom } from '@dydxprotocol/v4-client-js/src/clients/constants';

import { STRING_KEYS } from '@/constants/localization';
import { NumberSign } from '@/constants/numbers';

import { useAccountBalance } from '@/hooks/useAccountBalance';
import { useStakingValidator } from '@/hooks/useStakingValidator';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { DiffOutput } from '@/components/DiffOutput';
import { Output, OutputType } from '@/components/Output';
import {
  StakeButtonAlert,
  StakeRewardButtonAndReceipt,
} from '@/components/StakeRewardButtonAndReceipt';
import { Tag } from '@/components/Tag';
import { ValidatorName } from '@/components/ValidatorName';
import { WithTooltip } from '@/components/WithTooltip';

import { BigNumberish, MustBigNumber } from '@/lib/numbers';

type ElementProps = {
  error?: StakeButtonAlert;
  fee?: BigNumberish;
  amount?: number;
  isLoading: boolean;
};

export const StakeButtonAndReceipt = ({ error, fee, amount, isLoading }: ElementProps) => {
  const stringGetter = useStringGetter();
  const { chainTokenLabel } = useTokenConfigs();
  const { nativeStakingBalance } = useAccountBalance();
  const { selectedValidator } = useStakingValidator() ?? {};

  const newStakedBalance = amount ? MustBigNumber(nativeStakingBalance).plus(amount) : undefined;

  const transferDetailItems = [
    {
      key: 'validator',
      label: (
        <WithTooltip tooltip="validator-selection">
          {stringGetter({ key: STRING_KEYS.SELECTED_VALIDATOR })}
        </WithTooltip>
      ),
      value: <ValidatorName validator={selectedValidator} />,
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
          newValue={newStakedBalance}
          hasInvalidNewValue={MustBigNumber(newStakedBalance).isNegative()}
          withDiff={
            newStakedBalance !== undefined &&
            !MustBigNumber(nativeStakingBalance).eq(newStakedBalance ?? 0)
          }
        />
      ),
    },
  ];

  return (
    <StakeRewardButtonAndReceipt
      detailItems={transferDetailItems}
      alert={error}
      buttonText={stringGetter({ key: STRING_KEYS.STAKE })}
      gasFee={fee}
      gasDenom={SelectedGasDenom.NATIVE}
      isLoading={isLoading}
      isForm
    />
  );
};
