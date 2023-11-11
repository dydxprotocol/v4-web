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
  buttonType: {
    options: ["text", "icon", "default"],
    control: { type: 'select' },
    defaultValue: "default",
  },
  children: {
    options: ['some text to copy'],
    control: { type: 'select' },
    defaultValue: undefined,
  }
};
