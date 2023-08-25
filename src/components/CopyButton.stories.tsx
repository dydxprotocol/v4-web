import type { Story } from '@ladle/react';

import { CopyButton, type CopyButtonProps } from '@/components/CopyButton';

import { StoryWrapper } from '.ladle/components';

export const CopyButtonStory: Story<CopyButtonProps> = (args) => (
  <StoryWrapper>
    <CopyButton {...args} />
  </StoryWrapper>
);

CopyButtonStory.args = {
  value: 'some text to copy',
};

CopyButtonStory.argTypes = {
  shownAsText: {
    options: [true, false],
    control: { type: 'select' },
    defaultValue: false,
  },
  children: {
    options: ['some text to copy'],
    control: { type: 'select' },
    defaultValue: undefined,
  }
};
