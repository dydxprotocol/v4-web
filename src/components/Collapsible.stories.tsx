import type { Story } from '@ladle/react';

import { Collapsible } from '@/components/Collapsible';

import { StoryWrapper } from '.ladle/components';
import { IconName } from './Icon';

export const CollapsibleStory: Story<Parameters<typeof Collapsible>> = (args) => (
  <StoryWrapper>
    <Collapsible
      label="Collapsible List of Items"
      {...args}
    >
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
