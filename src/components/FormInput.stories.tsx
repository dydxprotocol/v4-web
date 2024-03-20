import type { Story } from '@ladle/react';

import { AlertType } from '@/constants/alerts';

import { Button } from '@/components/Button';
import { FormInput, FormInputProps } from '@/components/FormInput';
import { InputType } from '@/components/Input';

import { StoryWrapper } from '.ladle/components';

export const FormInputWithValidationStory: Story<FormInputProps> = (args) => {
  return (
    <StoryWrapper>
      <FormInput {...args} />
    </StoryWrapper>
  );
};

FormInputWithValidationStory.args = {
  decimals: 2,
  max: 100,
  placeholder: '',
  label: 'label',
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

export const FormInputStoryWithSlotRight: Story<FormInputProps> = (args) => {
  return (
    <StoryWrapper>
      <FormInput slotRight={<Button>Submit</Button>} {...args} />
    </StoryWrapper>
  );
};

FormInputStoryWithSlotRight.args = {
  decimals: 2,
  max: 100,
  placeholder: '',
  label: 'label',
  validationConfig: {
    attached: false,
    type: AlertType.Error,
    message: 'Error message',
  },
};

FormInputStoryWithSlotRight.argTypes = {
  type: {
    options: Object.values(InputType),
    control: { type: 'select' },
    defaultValue: InputType.Number,
  },
};
