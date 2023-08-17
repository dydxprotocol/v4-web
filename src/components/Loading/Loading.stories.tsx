import type { Story } from '@ladle/react';

import { LoadingDots, LoadingDotsProps } from '@/components/Loading/LoadingDots';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { LoadingOutput } from '@/components/Loading/LoadingOutput';
import { StoryWrapper } from '.ladle/components';

export const Dots: Story<LoadingDotsProps> = (args) => {
  return (
    <StoryWrapper>
      <LoadingDots {...args} />
    </StoryWrapper>
  );
};

Dots.args = {
  size: 4,
};

export const Spinner: Story = (args) => {
  return (
    <StoryWrapper>
      <LoadingSpinner {...args} />
    </StoryWrapper>
  );
};

Spinner.args = {};

export const Output: Story = (args) => {
  return (
    <StoryWrapper>
      <LoadingOutput {...args} />
    </StoryWrapper>
  );
};

Output.args = {};
