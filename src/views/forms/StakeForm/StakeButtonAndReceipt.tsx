import { shallowEqual } from 'react-redux';
import styled from 'styled-components';

import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { NumberSign } from '@/constants/numbers';

import { useAccountBalance } from '@/hooks/useAccountBalance';
import { useStakingValidator } from '@/hooks/useStakingValidator';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { Button } from '@/components/Button';
import { DiffOutput } from '@/components/DiffOutput';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { ValidatorName } from '@/components/ValidatorName';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';
import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { useAppSelector } from '@/state/appTypes';

import { BigNumberish, MustBigNumber } from '@/lib/numbers';

type ElementProps = {
  fee?: BigNumberish;
  amount?: number;
  isDisabled?: boolean;
  isLoading?: boolean;
  error?: string;
};

export const StakeButtonAndReceipt = ({
  fee,
  amount,
  isDisabled,
  isLoading,
  error,
}: ElementProps) => {
  const stringGetter = useStringGetter();
  const canAccountTrade = useAppSelector(calculateCanAccountTrade, shallowEqual);
  const { chainTokenLabel } = useTokenConfigs();
  const { nativeStakingBalance } = useAccountBalance();
  const { selectedValidator } = useStakingValidator() ?? {};

  const newStakedBalance = amount ? MustBigNumber(nativeStakingBalance).plus(amount) : undefined;

  const transferDetailItems = [
    {
      key: 'validator',
      label: <span>{stringGetter({ key: STRING_KEYS.SELECTED_VALIDATOR })}</span>,
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
    <$WithDetailsReceipt detailItems={transferDetailItems}>
      {!canAccountTrade ? (
        <OnboardingTriggerButton size={ButtonSize.Base} />
      ) : (
        <Button
          action={ButtonAction.Primary}
          type={ButtonType.Submit}
          state={{ isLoading, isDisabled }}
          slotLeft={error ? <$WarningIcon iconName={IconName.Warning} /> : undefined}
        >
          {stringGetter({ key: STRING_KEYS.STAKE })}
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

const $WarningIcon = styled(Icon)`
  color: var(--color-warning);
`;
