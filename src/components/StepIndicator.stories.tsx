import type { Story } from '@ladle/react';

import { StepIndicator, type StepIndicatorProps } from './StepIndicator';
import { StoryWrapper } from '.ladle/components';

export const StepIndicatorStory: Story<StepIndicatorProps> = (args) => (
  <StoryWrapper>
    <StepIndicator {...args} />
  </StoryWrapper>
);

StepIndicatorStory.args = {
  currentStepIndex: 1,
  totalSteps: 3,
};
