import { SelectedGasDenom } from '@dydxprotocol/v4-client-js/src/clients/constants';

import { STRING_KEYS } from '@/constants/localization';
import { NumberSign } from '@/constants/numbers';

import { useAccountBalance } from '@/hooks/useAccountBalance';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { DiffOutput } from '@/components/DiffOutput';
import { Output, OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';
import {
  StakeRewardButtonAndReceipt,
  type StakeButtonAlert,
} from '@/views/StakeRewardButtonAndReceipt';

import { BigNumberish, MustBigNumber } from '@/lib/numbers';

type ElementProps = {
  error?: StakeButtonAlert;
  fee?: BigNumberish;
  amount?: number;
  isLoading: boolean;
  allAmountsEmpty: boolean;
};

export const UnstakeButtonAndReceipt = ({
  error,
  fee,
  amount,
  isLoading,
  allAmountsEmpty,
}: ElementProps) => {
  const stringGetter = useStringGetter();
  const { chainTokenLabel } = useTokenConfigs();
  const { nativeTokenBalance } = useAccountBalance();

  const newStakedBalance = amount ? MustBigNumber(nativeTokenBalance).plus(amount) : undefined;

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
    <StakeRewardButtonAndReceipt
      detailItems={transferDetailItems}
      alert={error}
      buttonText={
        allAmountsEmpty
          ? stringGetter({ key: STRING_KEYS.ENTER_AMOUNT_TO_STAKE }) // xcxc
          : stringGetter({ key: STRING_KEYS.UNSTAKE })
      }
      gasFee={fee}
      gasDenom={SelectedGasDenom.NATIVE}
      isLoading={isLoading}
      isForm
    />
  );
};
