import type { Story } from '@ladle/react';

import { tooltipStrings } from '@/constants/tooltips';

import { WithTooltip } from '@/components/WithTooltip';

import { StoryWrapper } from '.ladle/components';

export const Tooltip: Story<Parameters<typeof WithTooltip>[0]> = (args) => {
  return (
    <StoryWrapper>
      <WithTooltip {...args}>
        <div>Hover me</div>
      </WithTooltip>
    </StoryWrapper>
  );
};

Tooltip.args = {
  withIcon: false,
};

Tooltip.argTypes = {
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
  tooltip: {
    options: Object.keys(tooltipStrings),
    control: { type: 'select' },
    defaultValue: Object.keys(tooltipStrings)[0],
  },
};
