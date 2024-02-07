import type { Story } from '@ladle/react';

import { Tag, TagSign, TagSize, TagType } from '@/components/Tag';

import { StoryWrapper } from '.ladle/components';

export const TagStory: Story<Parameters<typeof Tag>[0]> = (args) => {
  return (
    <StoryWrapper>
      <Tag {...args} />
    </StoryWrapper>
  );
};

TagStory.args = {
  children: 'USDC',
  isHighlighted: false,
};

TagStory.argTypes = {
  size: {
    options: Object.values(TagSize),
    control: { type: 'select' },
    defaultValue: TagSize.Small,
  },
  type: {
    options: [...Object.values(TagType), undefined],
    control: { type: 'select' },
    defaultValue: undefined,
  },
  sign: {
    options: [...Object.values(TagSign), undefined],
    control: { type: 'select' },
    defaultValue: undefined,
  },
};
