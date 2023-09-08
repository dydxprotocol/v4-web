import type { Story } from '@ladle/react';

import { StoryWrapper } from '.ladle/components';
import { TimeoutButton, type TimeoutButtonProps } from './TimeoutButton';

export const TimeoutButtonStory: Story<TimeoutButtonProps> = (args) => {
  return (
    <StoryWrapper>
      <TimeoutButton
        {...args}
        onClick={() => alert('Timeout button clicked!')}
      >
        Continue
      </TimeoutButton>
    </StoryWrapper>
  );
};

TimeoutButtonStory.args = {
  timeoutInSeconds: 5,
};
