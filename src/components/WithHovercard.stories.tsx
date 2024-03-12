import type { Story } from '@ladle/react';

import { tooltipStrings } from '@/constants/tooltips';

import { Button } from '@/components/Button';
import { WithHovercard } from '@/components/WithHovercard';

import { StoryWrapper } from '.ladle/components';

export const Hovercard: Story<Parameters<typeof WithHovercard>[0]> = (args) => {
  return (
    <StoryWrapper>
      <WithHovercard
        {...args}
        slotTrigger={<div>Trigger</div>}
        slotButton={<Button>Button</Button>}
      ></WithHovercard>
    </StoryWrapper>
  );
};

Hovercard.args = {};

Hovercard.argTypes = {
  align: {
    options: ['start', 'center', 'end'],
    control: { type: 'select' },
    defaultValue: 'start',
  },
  side: {
    options: ['top', 'bottom', 'left', 'right'],
    control: { type: 'select' },
    defaultValue: 'top',
  },
  hovercard: {
    options: Object.keys(tooltipStrings),
    control: { type: 'select' },
    defaultValue: Object.keys(tooltipStrings)[0],
  },
};
