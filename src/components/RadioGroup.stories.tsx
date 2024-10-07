import { useState } from 'react';

import type { Story } from '@ladle/react';

import { RadioGroup } from '@/components/RadioGroup';

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

export const RadioGroupStory: Story<Pick<Parameters<typeof RadioGroup>[0], 'items'>> = (args) => {
  const [item, setItem] = useState(exampleItems[0].value);
  return (
    <StoryWrapper>
      <RadioGroup value={item} onValueChange={(value) => setItem(value)} {...args} />
    </StoryWrapper>
  );
};

RadioGroupStory.args = {
  items: exampleItems,
};

RadioGroupStory.argTypes = {};
