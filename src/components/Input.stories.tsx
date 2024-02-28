import type { Story } from '@ladle/react';

import { Input, InputProps, InputType } from '@/components/Input';

import { StoryWrapper } from '.ladle/components';

export const InputStory: Story<InputProps> = (args) => {
  return (
    <StoryWrapper>
      <Input {...args} />
    </StoryWrapper>
  );
};

InputStory.args = {
  decimals: 2,
  max: 100,
  placeholder: '',
};

InputStory.argTypes = {
  type: {
    options: Object.values(InputType),
    control: { type: 'select' },
    defaultValue: InputType.Number,
  },
};
