import { Dispatch, SetStateAction } from 'react';

import { Validator } from '@dydxprotocol/v4-client-js/build/node_modules/@dydxprotocol/v4-proto/src/codegen/cosmos/staking/v1beta1/staking';
import { SelectedGasDenom } from '@dydxprotocol/v4-client-js/src/clients/constants';
import BigNumber from 'bignumber.js';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { NumberSign } from '@/constants/numbers';

import { useAccountBalance } from '@/hooks/useAccountBalance';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import { DiffOutput } from '@/components/DiffOutput';
import { Link } from '@/components/Link';
import { Output, OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { WithTooltip } from '@/components/WithTooltip';
import {
  StakeButtonAlert,
  StakeRewardButtonAndReceipt,
} from '@/views/forms/StakingForms/shared/StakeRewardButtonAndReceipt';

import { BigNumberish, MustBigNumber } from '@/lib/numbers';

import { ValidatorDropdown } from './ValidatorDropdown';

type ElementProps = {
  error?: StakeButtonAlert;
  fee?: BigNumberish;
  amount?: BigNumber;
  isLoading: boolean;
  selectedValidator: Validator | undefined;
  setSelectedValidator: Dispatch<SetStateAction<Validator | undefined>>;
};

export const StakeButtonAndReceipt = ({
  error,
  fee,
  amount,
  isLoading,
  selectedValidator,
  setSelectedValidator,
}: ElementProps) => {
  const stringGetter = useStringGetter();
  const { chainTokenLabel } = useTokenConfigs();
  const { mintscanValidatorsLearnMore } = useURLConfigs();
  const { nativeStakingBalance } = useAccountBalance();

  const newStakedBalance = amount ? MustBigNumber(nativeStakingBalance).plus(amount) : undefined;

  const transferDetailItems = [
    {
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
      buttonText={stringGetter({
        key: amount !== undefined ? STRING_KEYS.PREVIEW_STAKE : STRING_KEYS.ENTER_AMOUNT_TO_STAKE,
      })}
      gasFee={fee}
      gasDenom={SelectedGasDenom.NATIVE}
      isLoading={isLoading}
      isForm
    />
  );
};

const $Link = styled(Link)`
  display: inline;
  text-decoration: underline;
`;
