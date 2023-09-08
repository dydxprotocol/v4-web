import type { Story } from '@ladle/react';
import { MemoryRouter } from 'react-router-dom';

import { BackButton } from '@/components/BackButton';

import { StoryWrapper } from '.ladle/components';

export const BackButtonStory: Story = () => {
  return (
    <StoryWrapper>
      <BackButton />
    </StoryWrapper>
  );
};

BackButtonStory.decorators = [
  (Story) => (
    <MemoryRouter initialEntries={['/']}>
      <Story />
    </MemoryRouter>
  ),
];
