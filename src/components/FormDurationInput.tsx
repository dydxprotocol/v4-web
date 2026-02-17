import { type NumberFormatValues } from 'react-number-format';
import styled from 'styled-components';

import { INTEGER_DECIMALS } from '@/constants/numbers';

import { layoutMixins } from '@/styles/layoutMixins';

import { FormInput } from '@/components/FormInput';
import { InputType } from '@/components/Input';

type FormDurationInputProps = {
  className?: string;
  hoursLabel: string;
  minutesLabel: string;
  hoursValue: string;
  minutesValue: string;
  onHoursChange: (values: NumberFormatValues) => void;
  onMinutesChange: (values: NumberFormatValues) => void;
};

export const FormDurationInput = ({
  className,
  hoursLabel,
  minutesLabel,
  hoursValue,
  minutesValue,
  onHoursChange,
  onMinutesChange,
}: FormDurationInputProps) => (
  <$Row className={className}>
    <FormInput
      id="duration-hours"
      type={InputType.Number}
      label={hoursLabel}
      onChange={onHoursChange}
      value={hoursValue}
      decimals={INTEGER_DECIMALS}
    />
    <FormInput
      id="duration-minutes"
      type={InputType.Number}
      label={minutesLabel}
      onChange={onMinutesChange}
      value={minutesValue}
      decimals={INTEGER_DECIMALS}
    />
  </$Row>
);

const $Row = styled.div`
  ${layoutMixins.gridEqualColumns}
  gap: var(--form-input-gap);
`;
