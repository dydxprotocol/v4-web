import type { Story } from '@ladle/react';

import { Button } from '@/components/Button';
import { WithDetailsReceipt, WithDetailsReceiptProps } from '@/components/WithDetailsReceipt';

import { type DetailsItem } from './Details';
import { StoryWrapper } from '.ladle/components';

const detailItems: DetailsItem[] = [
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

export const WithDetailsReceiptStory: Story<WithDetailsReceiptProps> = (args) => (
  <StoryWrapper>
    <div style={{ width: 200 }}>
      <WithDetailsReceipt {...args}>
        <Button>Hello there</Button>
      </WithDetailsReceipt>
    </div>
  </StoryWrapper>
);

WithDetailsReceiptStory.args = {
  detailItems,
};

WithDetailsReceiptStory.argTypes = {
  side: {
    options: ['top', 'bottom'],
    control: { type: 'select' },
    defaultValue: 'top',
  },
};
