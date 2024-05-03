import { useState } from 'react';

import type { Story } from '@ladle/react';

import { Collapsible, type CollapsibleProps } from '@/components/Collapsible';

import { Checkbox } from './Checkbox';
import { IconName } from './Icon';
import { StoryWrapper } from '.ladle/components';

export const CollapsibleStoryWithIconTrigger: Story<CollapsibleProps> = (args) => (
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

CollapsibleStoryWithIconTrigger.args = {
  disabled: false,
  withTrigger: true,
  label: 'Collapsible List of Items',
};

CollapsibleStoryWithIconTrigger.argTypes = {
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

export const CollapsibleStoryWithSlotTrigger: Story<CollapsibleProps> = (args) => {
  const [checked, setChecked] = useState(false);
  return (
    <StoryWrapper>
      <Collapsible
        {...args}
        slotTrigger={<Checkbox checked={checked} onCheckedChange={setChecked} />}
        open={checked}
        onOpenChange={setChecked}
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
};

CollapsibleStoryWithSlotTrigger.args = {
  disabled: false,
  withTrigger: true,
  label: 'Collapsible List of Items',
};

CollapsibleStoryWithSlotTrigger.argTypes = {
  triggerIconSide: {
    options: ['left', 'right'],
    control: { type: 'select' },
    defaultValue: 'left',
  },
};
