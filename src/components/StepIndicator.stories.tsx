import type { Story } from '@ladle/react';

import { StoryWrapper } from '.ladle/components';

import { StepIndicator, type StepIndicatorProps } from './StepIndicator';

export const StepIndicatorStory: Story<StepIndicatorProps> = (args) => (
  <StoryWrapper>
    <StepIndicator {...args} />
  </StoryWrapper>
);

StepIndicatorStory.args = {
  currentStepIndex: 1,
  totalSteps: 3,
};
