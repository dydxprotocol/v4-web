import type { Story } from '@ladle/react';

import { Panel } from '@/components/Panel';

import { StoryWrapper } from '.ladle/components';

export const PanelStory: Story<{ slotHeader: React.ReactNode, children?: React.ReactNode }> = (args) => {
  return (
    <StoryWrapper>
      <Panel {...args} />
    </StoryWrapper>
  );
};

PanelStory.args = {
  slotHeader: 'Header',
  children: 'Content',
};
