import type { Story } from '@ladle/react';

import { NumberSign } from '@/constants/numbers';

import { DiffArrow, type DiffArrowProps } from '@/components/DiffArrow';

import { StoryWrapper } from '.ladle/components';

export const DiffArrowStory: Story<DiffArrowProps> = (args) => (
  <StoryWrapper>
    <DiffArrow {...args} />
  </StoryWrapper>
);

DiffArrowStory.argTypes = {
  direction: {
    options: ['left', 'right', 'up', 'down'],
    control: { type: 'select' },
    defaultValue: 'right',
  },
  sign: {
    options: Object.values(NumberSign),
    control: { type: 'select' },
    defaultValue: NumberSign.Neutral,
  },
};
