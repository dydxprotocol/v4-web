import type { Story } from '@ladle/react';

import { Tag } from '@/components/Tag';

import { StoryWrapper } from '.ladle/components';

export const TagStory: Story<Parameters<typeof Tag>> = (args) => {
  return (
    <StoryWrapper>
      <Tag {...args} />
    </StoryWrapper>
  );
};

TagStory.args = {
  children: 'USDC',
};
