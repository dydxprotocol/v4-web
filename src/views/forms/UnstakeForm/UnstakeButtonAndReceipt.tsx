import { shallowEqual, useSelector } from 'react-redux';
import styled from 'styled-components';

import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { NumberSign } from '@/constants/numbers';

import { useAccountBalance } from '@/hooks/useAccountBalance';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { Button } from '@/components/Button';
import { DiffOutput } from '@/components/DiffOutput';
import { Output, OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';
import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { calculateCanAccountTrade } from '@/state/accountCalculators';

import { BigNumberish, MustBigNumber } from '@/lib/numbers';

type ElementProps = {
  fee?: BigNumberish;
  amount?: number;
  isDisabled?: boolean;
  isLoading?: boolean;
};

export const UnstakeButtonAndReceipt = ({ fee, amount, isDisabled, isLoading }: ElementProps) => {
  const stringGetter = useStringGetter();
  const canAccountTrade = useSelector(calculateCanAccountTrade, shallowEqual);
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
    <$WithDetailsReceipt detailItems={transferDetailItems}>
      {!canAccountTrade ? (
        <OnboardingTriggerButton size={ButtonSize.Base} />
      ) : (
        <Button
          action={ButtonAction.Primary}
          type={ButtonType.Submit}
          state={{ isLoading, isDisabled }}
        >
          {stringGetter({ key: STRING_KEYS.UNSTAKE })}
        </Button>
      )}
    </$WithDetailsReceipt>
  );
};
const $WithDetailsReceipt = styled(WithDetailsReceipt)`
  --withReceipt-backgroundColor: var(--color-layer-2);

  dl {
    padding: var(--form-input-paddingY) var(--form-input-paddingX);
  }
`;
