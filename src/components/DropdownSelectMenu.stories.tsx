import { useState } from 'react';
import type { Story } from '@ladle/react';

import { DropdownSelectMenu } from '@/components/DropdownSelectMenu';

import { StoryWrapper } from '.ladle/components';

const exampleItems = [
  {
    value: '1',
    label: 'Item 1',
    slotBefore: '1️⃣',
  },
  {
    value: '2',
    label: 'Item 2',
    slotBefore: '2️⃣',
  },
  {
    value: '3',
    label: 'Item 3',
    slotBefore: '3️⃣',
  },
  {
    value: '4',
    label: 'Item 4',
    slotBefore: '4️⃣',
  },
];

export const DropdownSelectMenuStory: Story<
  Pick<Parameters<typeof DropdownSelectMenu>[0], 'items' | 'align' | 'sideOffset' | 'disabled'>
> = (args) => {
  const [item, setItem] = useState(exampleItems[0].value);
  return (
    <StoryWrapper>
      <DropdownSelectMenu value={item} onValueChange={(value) => setItem(value)} {...args} />
    </StoryWrapper>
  );
};

DropdownSelectMenuStory.args = {
  items: exampleItems,
  sideOffset: 1,
  disabled: false,
};

DropdownSelectMenuStory.argTypes = {
  align: {
    options: ['start', 'center', 'end'],
    control: { type: 'select' },
    defaultValue: 'center',
  },
};
