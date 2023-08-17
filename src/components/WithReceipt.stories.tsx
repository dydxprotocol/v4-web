import type { Story } from '@ladle/react';

import { Button } from '@/components/Button';

import { WithReceipt } from '@/components/WithReceipt';
import { type DetailsItem } from './Details';

import { StoryWrapper } from '.ladle/components';

const items: DetailsItem[] = [
  {
    key: 'item-1',
    label: 'Item 1',
    value: 'Value 1',
  },
  {
    key: 'item-2',
    label: 'Item 2',
    value: 'Value 2',
  },
  {
    key: 'item-3',
    label: 'Item 3',
    value: 'Value 3',
  },
];

export const WithReceiptStory: Story<Parameters<WithReceipt>> = (args) => (
  <StoryWrapper>
    <div style={{ width: 200 }}>
      <WithReceipt {...args}>
        <Button>Hello there</Button>
      </WithReceipt>
    </div>
  </StoryWrapper>
);

WithReceiptStory.args = {
  items,
};

WithReceiptStory.argTypes = {
  side: {
    options: ['top', 'bottom'],
    control: { type: 'select' },
    defaultValue: 'top',
  },
};
