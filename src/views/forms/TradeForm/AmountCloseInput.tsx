import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useQuickUpdatingState } from '@/hooks/useQuickUpdatingState';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { formMixins } from '@/styles/formMixins';

import { Input, InputType } from '@/components/Input';
import { Slider } from '@/components/Slider';
import { WithLabel } from '@/components/WithLabel';

import { mapIfPresent } from '@/lib/do';
import { MustBigNumber } from '@/lib/numbers';

export const AmountCloseInput = ({
  amountClosePercentInput,
  setAmountCloseInput,
}: {
  amountClosePercentInput: string | undefined;
  setAmountCloseInput: (val: string | undefined) => void;
}) => {
  const {
    value: amountClose,
    setValue: setAmountClose,
    commitValue: commitAmountClose,
  } = useQuickUpdatingState<string | undefined>({
    setValueSlow: setAmountCloseInput,
    slowValue: amountClosePercentInput,
    debounceMs: 100,
  });

  const onSliderDrag = ([newValue]: number[]) => {
    const newValueString = mapIfPresent(newValue, (lev) => MustBigNumber(lev).toFixed(0));
    setAmountClose(newValueString ?? '');
  };

  const commitValue = (newValue: string | undefined) => {
    commitAmountClose(newValue);
  };

  const onValueCommit = ([newValue]: number[]) => {
    commitValue(MustBigNumber(newValue).toFixed(0));
  };

  const stringGetter = useStringGetter();
  return (
    <$InputContainer>
      <$WithLabel
        label={<div tw="mb-0.25 flex">{stringGetter({ key: STRING_KEYS.AMOUNT_CLOSE })}</div>}
      >
        <$AmountCloseSlider
          label={stringGetter({ key: STRING_KEYS.AMOUNT_CLOSE })}
          min={0}
          max={100}
          step={0.1}
          value={MustBigNumber(amountClose).toNumber()}
          onSliderDrag={onSliderDrag}
          onValueCommit={onValueCommit}
        />
      </$WithLabel>
      <$InnerInputContainer>
        <Input
          placeholder={`${MustBigNumber(amountClose).toFixed(0)}%`}
          type={InputType.Percent}
          value={amountClose}
          max={100}
          onInput={({ formattedValue }: { formattedValue: string }) => {
            commitValue(formattedValue);
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

  padding: var(--form-input-paddingY) var(--form-input-paddingX);

  @media ${breakpoints.tablet} {
    --input-height: 4rem;
  }
`;

const $WithLabel = styled(WithLabel)`
  ${formMixins.inputLabel}
`;

const $InnerInputContainer = styled.div`
  ${formMixins.inputContainer}
  --input-backgroundColor: var(--color-layer-4);
  --input-borderColor: none;
  --input-height: 2.25rem;
  --input-width: 5rem;

  margin-left: 0.25rem;

  input {
    text-align: end;
    padding: 0 var(--form-input-paddingX);
  }

  @media ${breakpoints.tablet} {
    --input-height: 2.5rem;
  }
`;

const $AmountCloseSlider = styled(Slider)`
  height: 1.375rem;
  --slider-track-background: linear-gradient(
    90deg,
    var(--color-layer-7) 0%,
    var(--color-text-2) 100%
  );
`;
