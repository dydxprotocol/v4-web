import type { Story } from '@ladle/react';

import { Button } from '@/components/Button';
import { WithReceipt } from '@/components/WithReceipt';

import { StoryWrapper } from '.ladle/components';

export const WithReceiptStory: Story<Omit<Parameters<typeof WithReceipt>[0], 'slotReceipt'>> = (
  args
) => (
  <StoryWrapper>
    <div style={{ width: 200 }}>
      <WithReceipt
        slotReceipt={
          <div
            style={{
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            Receipt Content
          </div>
        }
        {...args}
      >
        <Button>Hello there</Button>
      </WithReceipt>
    </div>
  </StoryWrapper>
);

WithReceiptStory.args = {
  hideReceipt: false,
};

WithReceiptStory.argTypes = {
  side: {
    options: ['top', 'bottom'],
    control: { type: 'select' },
    defaultValue: 'top',
  },
};
