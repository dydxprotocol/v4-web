import { useEffect, useState } from 'react';

import styled from 'styled-components';

import breakpoints from '@/styles/breakpoints';
import { formMixins } from '@/styles/formMixins';

import { Input, InputType } from '@/components/Input';
import { Slider } from '@/components/Slider';

import { MustBigNumber } from '@/lib/numbers';

export const AllocationSlider = ({
  allocationPercentInput,
  setAllocationInput,
}: {
  allocationPercentInput: string | undefined;
  setAllocationInput: (val: string | undefined) => void;
}) => {
  const [localValue, setLocalValue] = useState<string | undefined>(allocationPercentInput);

  useEffect(() => {
    setLocalValue(allocationPercentInput);
  }, [allocationPercentInput]);

  const onSliderDrag = ([newValue]: number[]) => {
    const newValueString = MustBigNumber(newValue).toFixed(0);
    setLocalValue(newValueString);
  };

  const onValueCommit = ([newValue]: number[]) => {
    const finalValue = MustBigNumber(newValue).toFixed(0);
    setLocalValue(finalValue);
    setAllocationInput(finalValue);
  };

  return (
    <$InputContainer>
      <div tw="w-full">
        <$AllocationSlider
          label="Allocation"
          min={0}
          max={100}
          step={1}
          value={MustBigNumber(localValue).toNumber()}
          onSliderDrag={onSliderDrag}
          onValueCommit={onValueCommit}
        />
      </div>
      <$InnerInputContainer>
        <Input
          placeholder={`${MustBigNumber(localValue).toFixed(0)}%`}
          type={InputType.Percent}
          value={localValue}
          max={100}
          onInput={({ formattedValue }: { formattedValue: string }) => {
            setLocalValue(formattedValue);
            setAllocationInput(formattedValue);
          }}
        />
      </$InnerInputContainer>
    </$InputContainer>
  );
};

const $InputContainer = styled.div`
  ${formMixins.inputContainer}
  --input-height: 3.5rem;
  --input-backgroundColor: none;

  @media ${breakpoints.tablet} {
    --input-height: 4rem;
  }
`;

const $InnerInputContainer = styled.div`
  ${formMixins.inputContainer}
  --input-backgroundColor: var(--color-layer-4);
  --input-borderColor: none;
  --input-height: 2.25rem;
  --input-width: 4rem;

  margin-left: 0.25rem;

  input {
    text-align: end;
    padding: 0 var(--form-input-paddingX);
  }

  @media ${breakpoints.tablet} {
    --input-height: 2.5rem;
  }
`;

const $AllocationSlider = styled(Slider)`
  height: 1.375rem;

  --slider-track-background: linear-gradient(
    90deg,
    var(--color-layer-7) 0%,
    var(--color-text-2) 100%
  );
`;
