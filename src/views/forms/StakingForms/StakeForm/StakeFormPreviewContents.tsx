import { Dispatch, SetStateAction } from 'react';

import { Validator } from '@dydxprotocol/v4-client-js/build/node_modules/@dydxprotocol/v4-proto/src/codegen/cosmos/staking/v1beta1/staking';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { StakeFormSteps } from '@/constants/stakingForms';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { AssetIcon } from '@/components/AssetIcon';
import { DetailsItem } from '@/components/Details';
import { Output, OutputType } from '@/components/Output';
import { ValidatorFaviconIcon } from '@/components/ValidatorFaviconIcon';
import { StakePreviewContents } from '@/views/forms/StakingForms/shared/StakePreviewContents';

type ElementProps = {
  detailItems: DetailsItem[];
  selectedValidator?: Validator;
  stakedAmount: number;
  isLoading: boolean;
  setCurrentStep: Dispatch<SetStateAction<StakeFormSteps>>;
};

export const StakeFormPreviewContents = ({
  detailItems,
  selectedValidator,
  stakedAmount,
  isLoading,
  setCurrentStep,
}: ElementProps) => {
  const stringGetter = useStringGetter();
  const { chainTokenLabel } = useTokenConfigs();

  const { website, moniker } = selectedValidator?.description ?? {};

  return (
    <StakePreviewContents
      submitText={stringGetter({ key: STRING_KEYS.CONFIRM_STAKE })}
      isLoading={isLoading}
      slotLeftHeading={stringGetter({ key: STRING_KEYS.AMOUNT_TO_STAKE })}
      slotRightHeading={stringGetter({ key: STRING_KEYS.VALIDATOR })}
      slotLeft={
        <>
          <AssetIcon
            symbol={chainTokenLabel}
            tw="text-[length:var(--icon-size)] [--icon-size:2.25rem]"
          />
          <Output value={stakedAmount} type={OutputType.Asset} tag={chainTokenLabel} />
        </>
      }
      slotRight={
        <>
          <ValidatorFaviconIcon
            url={website}
            fallbackText={moniker}
            tw="h-[var(--icon-size)] w-[var(--icon-size)] [--icon-size:2.25rem]"
          />
          {moniker}
        </>
      }
      detailItems={detailItems}
      setCurrentStep={setCurrentStep}
    />
  );
};
