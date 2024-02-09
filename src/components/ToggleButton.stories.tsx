import type { Story } from '@ladle/react';

import { ButtonShape, ButtonSize } from '@/constants/buttons';

import { StoryWrapper } from '.ladle/components';
import { ToggleButton } from './ToggleButton';

export const ToggleButtonStory: Story<Parameters<typeof ToggleButton>[0]> = (args) => (
  <StoryWrapper>
    <ToggleButton {...args}>Toggle me</ToggleButton>
  </StoryWrapper>
);

ToggleButtonStory.argTypes = {
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
