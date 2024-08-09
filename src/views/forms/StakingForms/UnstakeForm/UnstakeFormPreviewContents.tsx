import { Dispatch, SetStateAction } from 'react';

import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { StakeFormSteps } from '@/constants/stakingForms';

import { useStakingValidator } from '@/hooks/useStakingValidator';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { DetailsItem } from '@/components/Details';
import { Output, OutputType } from '@/components/Output';
import { ValidatorIcons } from '@/components/ValidatorIcons';

import { MustBigNumber } from '@/lib/numbers';

import { StakePreviewContents } from '../shared/StakePreviewContents';

type ElementProps = {
  amounts: Record<string, number | undefined>;
  detailItems: DetailsItem[];
  isLoading: boolean;
  setCurrentStep: Dispatch<SetStateAction<StakeFormSteps>>;
};

export const UnstakeFormPreviewContents = ({
  amounts,
  detailItems,
  isLoading,
  setCurrentStep,
}: ElementProps) => {
  const stringGetter = useStringGetter();
  const { chainTokenLabel } = useTokenConfigs();
  const { stakingValidators, currentDelegations } = useStakingValidator() ?? {};
  const delegationsToUnstake =
    currentDelegations?.filter((delegation) =>
      MustBigNumber(amounts[delegation.validator]).gt(0)
    ) ?? [];
  const unstakingValidators = stakingValidators
    ? delegationsToUnstake.map((delegation) => stakingValidators[delegation.validator]?.[0])
    : [];

  return (
    <StakePreviewContents
      submitText={stringGetter({ key: STRING_KEYS.CONFIRM_UNSTAKE })}
      isLoading={isLoading}
      slotLeftHeading={stringGetter({
        key: unstakingValidators?.length === 1 ? STRING_KEYS.VALIDATOR : STRING_KEYS.VALIDATORS,
      })}
      slotRightHeading={stringGetter({
        key: STRING_KEYS.AMOUNT_TO_UNSTAKE,
      })}
      slotLeft={
        <>
          <ValidatorIcons
            numToShow={3}
            validators={unstakingValidators}
            tw="[--border-color:--color-layer-4] [--icon-size:2.25rem]"
          />
          <$ValidatorsLabel>
            {unstakingValidators.map((validator) => validator.description?.moniker).join(', ')}
          </$ValidatorsLabel>
        </>
      }
      slotRight={
        <>
          <AssetIcon
            symbol={chainTokenLabel}
            tw="text-[length:--icon-size] [--icon-size:2.25rem]"
          />
          <Output
            value={delegationsToUnstake.reduce(
              (sum, delegation) => sum + (amounts[delegation.validator] ?? 0),
              0
            )}
            type={OutputType.Asset}
            tag={chainTokenLabel}
          />
        </>
      }
      detailItems={detailItems}
      setCurrentStep={setCurrentStep}
    />
  );
};
const $ValidatorsLabel = styled.div`
  ${layoutMixins.textLineClamp}
`;
