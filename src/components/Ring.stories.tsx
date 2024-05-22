import type { Story } from '@ladle/react';

import { Ring } from '@/components/Ring';

import { StoryWrapper } from '.ladle/components';

export const RingStory: Story<{ value: number }> = ({ value }: { value: number }) => {
  return (
    <StoryWrapper>
      <Ring value={value / 100} />
    </StoryWrapper>
  );
};

RingStory.args = {
  value: 0,
};
