import { useState } from 'react';

import type { Story } from '@ladle/react';

import { Input, InputType, InputProps } from '@/components/Input';

import { StoryWrapper } from '.ladle/components';

export const InputStory: Story<InputProps> = (args) => {
  const [value, setValue] = useState('');
  return (
    <StoryWrapper>
      <Input
        {...args}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
        value={value}
      />
    </StoryWrapper>
  );
};

InputStory.args = {
  decimals: 2,
  max: '',
  min: '',
  placeholder: '',
};

InputStory.argTypes = {
  type: {
    options: Object.values(InputType),
    control: { type: 'select' },
    defaultValue: InputType.Number,
  },
};
