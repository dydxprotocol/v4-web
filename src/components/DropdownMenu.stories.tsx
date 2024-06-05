/* eslint-disable no-alert */
import type { Story } from '@ladle/react';

import { DropdownMenu } from '@/components/DropdownMenu';

import { StoryWrapper } from '.ladle/components';

export const DropdownMenuStory: Story<Parameters<typeof DropdownMenu>[0]> = (args) => {
  return (
    <StoryWrapper>
      <DropdownMenu {...args}>
        <span>Menu</span>
      </DropdownMenu>
    </StoryWrapper>
  );
};

DropdownMenuStory.args = {
  items: [
    {
      value: '0',
      label: 'Item 0',
      onSelect: () => alert('Item 0 action'),
    },
    {
      value: '1',
      label: 'Item 1 (accent)',
      onSelect: () => alert('Item 1 action'),
      highlightColor: 'accent',
    },
    {
      value: '2',
      label: 'Item 2 (create)',
      onSelect: () => alert('Item 2 action'),
      highlightColor: 'create',
    },
    {
      value: '3',
      label: 'Item 3 (destroy)',
      onSelect: () => alert('Item 3 action'),
      highlightColor: 'destroy',
    },
  ],
};

DropdownMenuStory.argTypes = {
  align: {
    options: ['start', 'center', 'end'],
    control: { type: 'select' },
    defaultValue: 'center',
  },
};
