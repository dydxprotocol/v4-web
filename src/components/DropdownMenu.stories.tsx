import type { Story } from '@ladle/react';

import { DropdownMenu } from '@/components/DropdownMenu';

import { StoryWrapper } from '.ladle/components';

export const DropdownMenuStory: Story<Parameters<typeof DropdownMenu>> = (args) => {
  const exampleItems = [
    {
      value: '1',
      label: 'Item 1',
      onSelect: () => alert('Item 1 action'),
    },
    {
      value: '2',
      label: 'Item 2',
      onSelect: () => alert('Item 2 action'),
    },
    {
      value: '3',
      label: 'Item 3',
      onSelect: () => alert('Item 3 action'),
    },
  ];

  return (
    <StoryWrapper>
      <DropdownMenu
        {...args}
        items={exampleItems}
      >
        <span>Menu</span>
      </DropdownMenu>
    </StoryWrapper>
  );
};

DropdownMenuStory.args = {};

DropdownMenuStory.argTypes = {
  align: {
    options: ['start', 'center', 'end'],
    control: { type: 'select' },
    defaultValue: 'center',
  },
};
