import type { Story } from '@ladle/react';

import { Collapsible, type CollapsibleProps } from '@/components/Collapsible';

import { StoryWrapper } from '.ladle/components';
import { IconName } from './Icon';

export const CollapsibleStory: Story<CollapsibleProps> = (args) => (
  <StoryWrapper>
    <Collapsible {...args}>
      <ul>
        <li>Collapsible Item 1</li>
        <li>Collapsible Item 2</li>
        <li>Collapsible Item 3</li>
        <li>Collapsible Item 4</li>
      </ul>
    </Collapsible>
  </StoryWrapper>
);

CollapsibleStory.args = {
  disabled: false,
  withTrigger: true,
  label: 'Collapsible List of Items',
};

CollapsibleStory.argTypes = {
  triggerIcon: {
    options: Object.values(IconName),
    control: { type: 'select' },
    defaultValue: IconName.Caret,
  },
  triggerIconSide: {
    options: ['left', 'right'],
    control: { type: 'select' },
    defaultValue: 'left',
  },
};
