import { useState } from 'react';
import type { Story } from '@ladle/react';

import { ButtonShape, ButtonSize } from '@/constants/buttons';

import { StoryWrapper } from '.ladle/components';
import { ToggleGroup } from './ToggleGroup';

const ToggleGroupItems = [
  {
    value: '0',
    label: 'Item 1',
  },
  {
    value: '1',
    label: 'Item 2',
  },
  {
    value: '2',
    label: 'Item 3',
  },
];

export const ToggleGroupStory: Story<Parameters<typeof ToggleGroup>> = (args) => {
  const [value, setValue] = useState('0');

  return (
    <StoryWrapper>
      <ToggleGroup items={ToggleGroupItems} value={value} onValueChange={setValue} {...args} />
    </StoryWrapper>
  );
};

ToggleGroupStory.argTypes = {
  size: {
    options: Object.values(ButtonSize),
    control: { type: 'select' },
    defaultValue: ButtonSize.XSmall,
  },
  shape: {
    options: Object.values(ButtonShape),
    control: { type: 'select' },
    defaultValue: ButtonShape.Pill,
  },
};
