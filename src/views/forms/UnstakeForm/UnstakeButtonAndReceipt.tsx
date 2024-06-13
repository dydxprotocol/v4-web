import { SelectedGasDenom } from '@dydxprotocol/v4-client-js/src/clients/constants';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { NumberSign } from '@/constants/numbers';

import { useAccountBalance } from '@/hooks/useAccountBalance';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { DiffOutput } from '@/components/DiffOutput';
import { Output, OutputType } from '@/components/Output';
import {
  StakeRewardButtonAndReceipt,
  type ButtonError,
} from '@/components/StakeRewardButtonAndReceipt';
import { Tag } from '@/components/Tag';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';

import { BigNumberish, MustBigNumber } from '@/lib/numbers';

type ElementProps = {
  error: ButtonError;
  fee?: BigNumberish;
  amount?: number;
  isLoading: boolean;
};

export const UnstakeButtonAndReceipt = ({ error, fee, amount, isLoading }: ElementProps) => {
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
      error={error}
      buttonText={stringGetter({ key: STRING_KEYS.UNSTAKE })}
      gasFee={fee}
      gasDenom={SelectedGasDenom.NATIVE}
      isLoading={isLoading}
      isForm
    />
  );
};
const $WithDetailsReceipt = styled(WithDetailsReceipt)`
  --withReceipt-backgroundColor: var(--color-layer-2);

  dl {
    padding: var(--form-input-paddingY) var(--form-input-paddingX);
  }
`;
