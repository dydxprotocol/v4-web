import type { Story } from '@ladle/react';

import { NumberSign } from '@/constants/numbers';

import { DiffOutput, DiffOutputType, type DiffOutputProps } from '@/components/DiffOutput';

import { StoryWrapper } from '.ladle/components';

export const DiffOutputStory: Story<DiffOutputProps> = (args) => (
  <StoryWrapper>
    <DiffOutput {...args} />
  </StoryWrapper>
);

DiffOutputStory.args = {
  value: 0,
  newValue: 0,
  fractionDigits: 0,
  hasInvalidNewValue: false,
  useGrouping: false,
  withDiff: true,
};

DiffOutputStory.argTypes = {
  direction: {
    options: ['left', 'right'],
    control: { type: 'select' },
    defaultValue: 'right',
  },
  layout: {
    options: ['row', 'column'],
    control: { type: 'select' },
    defaultValue: 'row',
  },
  sign: {
    options: Object.values(NumberSign),
    control: { type: 'select' },
    defaultValue: NumberSign.Neutral,
  },
  type: {
    options: Object.values(DiffOutputType),
    control: { type: 'select' },
    defaultValue: DiffOutputType.Number,
  },
};
