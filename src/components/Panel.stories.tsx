import type { Story } from '@ladle/react';

import { Panel, PanelProps } from '@/components/Panel';

import { StoryWrapper } from '.ladle/components';

export const PanelStory: Story<PanelProps> = (args) => {
  return (
    <StoryWrapper>
      <Panel {...args} />
    </StoryWrapper>
  );
};

PanelStory.args = {
  slotHeaderContent: 'Header',
  children: 'Content',
  slotRight: '1️⃣',
  hasSeparator: true,
};
