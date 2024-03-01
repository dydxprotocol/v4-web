import { useState } from 'react';

import type { Story } from '@ladle/react';

import { AlertType } from '@/constants/alerts';

import { Button } from '@/components/Button';
import { FormInput, FormInputProps } from '@/components/FormInput';
import { InputType } from '@/components/Input';

import { StoryWrapper } from '.ladle/components';

export const FormInputWithValidationStory: Story<FormInputProps> = (args) => {
  const [value, setValue] = useState('');

  return (
    <StoryWrapper>
      <FormInput
        {...args}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
        value={value}
      />
    </StoryWrapper>
  );
};

FormInputWithValidationStory.args = {
  decimals: 2,
  max: '',
  min: '',
  placeholder: '',
  validationConfig: {
    attached: false,
    type: AlertType.Error,
    message: 'Error message',
  },
};

FormInputWithValidationStory.argTypes = {
  type: {
    options: Object.values(InputType),
    control: { type: 'select' },
    defaultValue: InputType.Number,
  },
};

export const FormInputStoryWithSlotOuterRight: Story<FormInputProps> = (args) => {
  const [value, setValue] = useState('');
  return (
    <StoryWrapper>
      <FormInput
        {...args}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
        slotOuterRight={<Button>Submit</Button>}
        value={value}
      />
    </StoryWrapper>
  );
};

FormInputStoryWithSlotOuterRight.args = {
  decimals: 2,
  max: '',
  min: '',
  placeholder: '',
  validationConfig: {
    attached: false,
    type: AlertType.Error,
    message: 'Error message',
  },
};

FormInputStoryWithSlotOuterRight.argTypes = {
  type: {
    options: Object.values(InputType),
    control: { type: 'select' },
    defaultValue: InputType.Number,
  },
};
